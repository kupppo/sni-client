'use client'

import { SNI } from '@/lib/sni'
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

export function AddFolderDialog({
  uri,
  close,
}: {
  uri: string
  close: () => void
}) {
  const [rootDir, setRootDir] = useState<string>('/')
  const [dirName, setDirName] = useState<string>('')
  const { mutate } = useSWRConfig()

  //TODO: Populate combo box with all folders

  //TODO: reset the values every time the dialog is shown
  useEffect(() => {
    setRootDir('/')
    setDirName('')
  }, [])

  const handleSubmit = (e: any) => {
    const newPath = rootDir + dirName
    e.preventDefault()
    SNI.makeDirectory(uri, newPath).then(() => {
      mutate(['readDirectory', rootDir, uri])
    })
    close()
    setRootDir('/')
    setDirName('')
  }

  return (
    <DialogContent className="sm:max-w-[425px]">
      <form onSubmit={handleSubmit}>
        <DialogHeader>
          <DialogTitle>Add Folder</DialogTitle>
          <DialogDescription>
            Words, words, words, words, words, ...
          </DialogDescription>
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
                  <SelectItem value="/">/</SelectItem>
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
          <Button type="submit">Confirm</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  )
}

export function RemoveFolderDialog({
  uri,
  close,
}: {
  uri: string
  close: () => void
}) {
  const [rootDir, setRootDir] = useState<string>('/')
  const [dirName, setDirName] = useState<string>('')
  const [folders, setFolders] = useState<string[]>([])
  const { mutate } = useSWRConfig()

  const updateRoot = (dir: string) => {
    setRootDir(dir)
    SNI.readDirectory(uri, dir).then((v: any[]) => {
      console.log(v)
      setFolders(v.filter((p: any) => p.type == 0).map((p: any) => p.name))
    })
  }

  useEffect(() => {
    updateRoot('/')
  }, [])

  const handleSubmit = (e: any) => {
    const thePath = rootDir + dirName
    e.preventDefault()
    SNI.deleteFile(uri, thePath).then(() => {
      mutate(['readDirectory', rootDir, uri])
    })
    close()
    setRootDir('/')
    setDirName('')
  }

  return (
    <DialogContent>
      <form onSubmit={handleSubmit}>
        <DialogHeader>
          <DialogTitle>Remove Folder</DialogTitle>
          <DialogDescription>
            Words, words, words, words, words, ...
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="rootDir" className="text-right">
              Parent
            </Label>
            <Select name="rootDir" onValueChange={updateRoot}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select root folder" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="/">/</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="dirName" className="text-right">
              Parent
            </Label>
            <Select name="dirName" onValueChange={setDirName}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select a folder" />
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
        </div>
        <DialogFooter>
          {/*TODO: Add alert to double check*/}
          <Button type="submit">Confirm</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  )
}

export function FolderDropdown({ uri }: { uri: string }) {
  const [mode, setMode] = useState(DialogMode.None)
  const [open, setOpen] = useState(false)
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
        <AddFolderDialog uri={uri} close={() => setOpen(false)} />
      )}
      {mode == DialogMode.Remove && (
        <RemoveFolderDialog uri={uri} close={() => setOpen(false)} />
      )}
    </Dialog>
  )
}
