'use client'

import { SNI } from '@/lib/sni'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useSWRConfig } from 'swr'
import { useEffect, useState } from 'react'

const DialogMode = {
  None: 0,
  Add: 1,
  Remove: 2,
}

const getSubFolders = async (uri: string, dir: string): Promise<string[]> => {
  const entries = await SNI.readDirectory(uri, dir)
  const subfolders = entries
    .filter((p: any) => p.type == 0)
    .map((p: any) => p.path)
  for (let i = subfolders.length - 1; i >= 0; i--) {
    const temp = await getSubFolders(uri, subfolders[i])
    temp.forEach((p: any) => subfolders.push(p))
  }
  return subfolders
}

export function AddFolderDialog({
  uri,
  folders,
  close,
}: {
  uri: string
  folders: string[]
  close: () => void
}) {
  const [rootDir, setRootDir] = useState<string>('/')
  const [dirName, setDirName] = useState<string>('')
  const { mutate } = useSWRConfig()

  const areInputsValid = () => {
    return rootDir != '' && dirName != ''
  }

  const handleSubmit = (e: any) => {
    const withSep = rootDir == '/' ? rootDir : rootDir + '/'
    const newPath = withSep + dirName
    e.preventDefault()
    SNI.makeDirectory(uri, newPath)
      .then(() => {
        mutate(['readDirectory', rootDir, uri])
        close()
      })
      .catch(() => {
        close()
      })
  }

  const resetInputs = () => {
    setRootDir('/')
    setDirName('')
  }

  return (
    <DialogContent className="sm:max-w-[425px]" onCloseAutoFocus={resetInputs}>
      <form onSubmit={handleSubmit}>
        <DialogHeader>
          <DialogTitle>Add Folder</DialogTitle>
          {/*<DialogDescription>
            Words, words, words, words, words, ...
          </DialogDescription>*/}
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="rootDir" className="text-right">
              Parent
            </Label>
            <Select name="rootDir" defaultValue="/" onValueChange={setRootDir}>
              <SelectTrigger className="w-[180px]">
                <SelectValue defaultValue="/" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {folders.map((f) => {
                    return (
                      <SelectItem key={f} value={f}>
                        {f}
                      </SelectItem>
                    )
                  })}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="add_name" className="text-right">
              Name
            </Label>
            <Input
              id="add_name"
              name="dirName"
              className="col-span-3"
              value={dirName}
              onChange={(e) => setDirName(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" disabled={!areInputsValid()}>
            Confirm
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  )
}

export function RemoveFolderDialog({
  uri,
  folders,
  close,
}: {
  uri: string
  folders: string[]
  close: () => void
}) {
  const [dirName, setDirName] = useState<string>('')
  const { mutate } = useSWRConfig()

  const handleSubmit = (e: any) => {
    const rootDir = dirName.slice(0, dirName.lastIndexOf('/'))
    e.preventDefault()
    SNI.deleteFile(uri, dirName)
      .then(() => {
        mutate(['readDirectory', rootDir == '' ? '/' : rootDir, uri])
        close()
      })
      .catch(() => {
        close()
      })
  }

  const resetInputs = () => setDirName('')

  return (
    <DialogContent onCloseAutoFocus={resetInputs}>
      <DialogHeader>
        <DialogTitle>Remove Folder</DialogTitle>
        {/*<DialogDescription>
          Words, words, words, words, words, ...
        </DialogDescription>*/}
      </DialogHeader>
      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="rootDir" className="text-right">
            Folder
          </Label>
          <Select name="dirName" onValueChange={setDirName}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select a folder" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {folders
                  .filter((f) => f != '/')
                  .map((f) => {
                    return (
                      <SelectItem key={f} value={f}>
                        {f}
                      </SelectItem>
                    )
                  })}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>
      <DialogFooter>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button disabled={dirName == ''}>Remove</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <form onSubmit={handleSubmit}>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the
                  selected folder: {dirName}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction type="submit">Continue</AlertDialogAction>
              </AlertDialogFooter>
            </form>
          </AlertDialogContent>
        </AlertDialog>
      </DialogFooter>
    </DialogContent>
  )
}

export function FolderDropdown({ uri }: { uri: string }) {
  const [mode, setMode] = useState(DialogMode.None)
  const [open, setOpen] = useState(false)
  const [folders, setFolders] = useState<string[]>([])

  const refreshFolders = () => {
    getSubFolders(uri, '/').then((v) => {
      const temp: string[] = ['/']
      v.forEach((p: any) => temp.push(p))
      setFolders(temp.sort())
    })
  }

  useEffect(() => {
    refreshFolders()
  }, [])

  const onClose = () => {
    refreshFolders()
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">Folders</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56">
          <DropdownMenuGroup>
            <DialogTrigger asChild>
              <DropdownMenuItem
                onClick={() => {
                  setMode(DialogMode.Add)
                }}
              >
                Add Folder
              </DropdownMenuItem>
            </DialogTrigger>
            <DialogTrigger asChild>
              <DropdownMenuItem
                onClick={() => {
                  setMode(DialogMode.Remove)
                }}
              >
                Remove Folder
              </DropdownMenuItem>
            </DialogTrigger>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      {mode == DialogMode.Add && (
        <AddFolderDialog uri={uri} folders={folders} close={onClose} />
      )}
      {mode == DialogMode.Remove && (
        <RemoveFolderDialog uri={uri} folders={folders} close={onClose} />
      )}
    </Dialog>
  )
}
