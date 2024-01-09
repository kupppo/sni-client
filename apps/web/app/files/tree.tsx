'use client'

import { useSNI } from '@/lib/sni'
import { bootFile, deleteFile, getFields, putFile, resetSystem, resetToMenu } from '@/lib/sni/api'
import {
  FileIcon,
  FolderIcon,
  FolderOpen,
  MinusSquare,
  PlusSquare,
  X as CloseIcon,
} from 'lucide-react'
import SNIError from '@/components/sniError'
import { useCallback, useEffect, useRef, useState } from 'react'
import { MouseEvent } from 'react'
import { useDropzone } from 'react-dropzone'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { useSWRConfig } from 'swr'

const Indents = ({ depth }: { depth: number }) => (
  <div className="flex ml-7">
    {Array.from({ length: depth }, (_value, index) => (
      <div
        key={index}
        style={{
          background:
            'linear-gradient(to right,transparent 18.5px,#333 18.5px,#333 19.5px,transparent 19.5px)',
          backgroundRepeat: 'no-repeat',
          verticalAlign: 'top',
        }}
        className={cn('w-8 h-6 block relative left-2')}
      />
    ))}
  </div>
)

function File({
  name,
  depth,
  path,
  setCurrentFile,
}: {
  depth: number
  name: string
  path: string
  // eslint-disable-next-line no-unused-vars
  setCurrentFile: (_path: string) => void
}) {
  const handleClick = useCallback(
    (evt: MouseEvent<HTMLButtonElement>) => {
      evt.preventDefault()
      setCurrentFile(path)
    },
    [setCurrentFile],
  )
  // For depth, insert indents
  return (
    <li className={'whitespace-nowrap relative'}>
      <div className={cn('flex items-center')}>
        {depth > 0 ? <Indents depth={depth} /> : <div className="w-8" />}
        <Button variant="plain" size="plain" onClick={handleClick}>
          <div className={cn('ml-4', 'pl-0.5', 'mr-2')}>
            <FileIcon size={18} strokeWidth={1} />
          </div>
          <span className={cn('text-md pr-4')}>{name}</span>
        </Button>
      </div>
    </li>
  )
}

function Folder({
  name,
  depth = 0,
  path,
  setCurrentFile,
  uri,
}: {
  name: string
  depth: number
  path: string
  setCurrentFile?: any
  uri: string
}) {
  const [open, setOpen] = useState(false)
  const handleOpen = useCallback(
    (evt: MouseEvent<HTMLButtonElement>) => {
      evt.preventDefault()
      setOpen(!open)
    },
    [open, setOpen],
  )

  return (
    <li className={'whitespace-nowrap relative'}>
      <button onClick={handleOpen} className={cn('flex items-center')}>
        {depth > 0 ? <Indents depth={depth} /> : <div className="w-8" />}
        <div className={cn('absolute')}>
          {open ? (
            <MinusSquare size={14} strokeWidth={2} />
          ) : (
            <PlusSquare size={14} strokeWidth={2} />
          )}
        </div>
        <div className={cn('ml-4 mr-2')}>
          {open ? (
            <FolderOpen size={20} strokeWidth={1} />
          ) : (
            <FolderIcon size={20} strokeWidth={1} />
          )}
        </div>
        <span className={cn('text-md')}>{name}</span>
      </button>
      {open && (
        <FileTree
          path={path}
          uri={uri}
          setCurrentFile={setCurrentFile}
          depth={depth + 1}
        />
      )}
    </li>
  )
}

function FileTree({
  uri,
  path = '/',
  setCurrentFile,
  depth = 0,
}: {
  uri: string
  path: string
  setCurrentFile?: any
  depth?: number
}): JSX.Element {
  const { data, isLoading, error } = useSNI(['readDirectory', path, uri])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    noClick: true,
    noDragEventsBubbling: true,
    onDrop: (acceptedFiles) => {
      toast(`Dropped ${acceptedFiles[0]?.name} into ${path}`)
    },
  })

  if (error) {
    console.error(error)
  }

  if (isLoading) {
    return <div />
  }

  if (data.length === 0) {
    return (
      <ul className={cn('list-none')}>
        <li className={'whitespace-nowrap relative'}>
          <div className={cn('flex items-center')}>
            {depth > 0 ? <Indents depth={depth} /> : <div className="w-8" />}
            <div className={cn('text-md opacity-50 ml-5 italic')}>Empty</div>
          </div>
        </li>
      </ul>
    )
  }

  const folders = data.filter((entry: any) => entry.type === 0)
  const files = data.filter((entry: any) => entry.type === 1)

  return (
    <div {...getRootProps()} className={cn(isDragActive && 'bg-zinc-400')}>
      <input {...getInputProps()} />
      <ul className={cn('list-none')}>
        {folders.map((folder: any) => (
          <Folder
            key={folder.path}
            {...folder}
            depth={depth}
            uri={uri}
            setCurrentFile={setCurrentFile}
          />
        ))}
        {files.map((file: any) => (
          <File
            key={file.path}
            depth={depth}
            setCurrentFile={setCurrentFile}
            path={file.path}
            {...file}
          />
        ))}
      </ul>
    </div>
  )
}

async function readFile(file: File): Promise<Uint8Array> {
  let reader = new FileReader()
  return new Promise((resolve, reject) => {
    reader.onload = async function () {
      try {
        const result = reader.result as ArrayBuffer
        const contents = new Uint8Array(result)
        resolve(contents)
      } catch (e) {
        const err = e as Error
        console.error(err.message)
        toast.error('Failed to load file')
        reject(err)
      }
    }
    reader.onerror = function () {
      toast.error('Failed to load file')
    }
    reader.readAsArrayBuffer(file)
  })
}

export default function FileTreeWrapper(): JSX.Element | null {
  const { mutate } = useSWRConfig()
  const data = useSNI('devices', { refreshInterval: 50 })
  const currentScreen = useSNI(['currentScreen', data?.current?.uri], {
    refreshInterval: 200,
  })

  const inputRef = useRef<HTMLInputElement>(null)
  const [currentFile, setCurrentFile] = useState<string | null>(null)
  const drawerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onKeydown = (evt: KeyboardEvent) => {
      if (evt.key === 'Escape') {
        setCurrentFile(null)
      }
    }
    const onClick = (evt: any) => {
      if (drawerRef.current?.contains(evt.target as Node)) {
        return
      }
      setCurrentFile(null)
    }
    if (currentFile) {
      document.body.classList.add('overflow-hidden')
      document.addEventListener('keydown', onKeydown)
      document.addEventListener('click', onClick)
    } else {
      document.body.classList.remove('overflow-hidden')
      document.removeEventListener('keydown', onKeydown)
      document.removeEventListener('click', onClick)
    }

    return () => {
      document.body.classList.remove('overflow-hidden')
      document.removeEventListener('keydown', onKeydown)
      document.removeEventListener('click', onClick)
    }
  }, [currentFile, drawerRef])

  const handleFileChange = useCallback(
    async (evt: any) => {
      const file = evt.target.files[0]
      const toastId = toast.loading(`Adding ${file.name}`)
      const fileContents = await readFile(file)
      await putFile(data.current.uri, file.name, fileContents)

      // revalidate directory to show new file
      mutate(['readDirectory', '/', data.current.uri], undefined, {
        revalidate: true,
      })
      toast.success(`Added ${file.name}`, {
        id: toastId,
      })
    },
    [data.current],
  )

  if (data.error) {
    return <SNIError error={data.error} />
  }

  const connected = data?.connected
  if (!connected) {
    return null
  }

  const requiredCapabilities = ['ReadDirectory', 'PutFile']
  const hasRequiredCapabilities = requiredCapabilities.every(
    (capability: string) => data.current.capabilities.includes(capability),
  )

  if (!hasRequiredCapabilities) {
    const err = new Error('Missing Filesystem Capabilities')
    return <SNIError error={err} />
  }

  return (
    <div className="w-full font-mono">
      <div className={cn('border-t border-zinc-800 px-4 py-4')} />
      <FileTree
        uri={data.current.uri}
        setCurrentFile={setCurrentFile}
        path="/"
      />
      <div className={cn('border-t border-zinc-900 mt-8 py-4 font-sans')}>
        <div className="flex gap-3">
          <Button
            variant="default"
            onClick={(evt) => {
              evt.preventDefault()
              inputRef.current?.click()
            }}
          >
            Add File
          </Button>
          {currentScreen?.data === 'game' && (
            <>
              <Button
                variant="outline"
                onClick={(evt) => {
                  evt.preventDefault()
                  resetSystem(data.current.uri)
                }}
              >
                Reset Game
              </Button>
              <Button
                variant="outline"
                onClick={(evt) => {
                  evt.preventDefault()
                  resetToMenu(data.current.uri)
                }}
              >
                Reset to Menu
              </Button>
            </>
          )}
          <input
            ref={inputRef}
            type="file"
            className="visually-hidden"
            onChange={handleFileChange}
          />
        </div>
      </div>
      <div
        className={cn(
          'fixed top-0 right-0 z-50 h-screen p-4 overflow-y-auto transition-transform translate-x-full w-96 bg-zinc-950 border-l border-zinc-900 flex flex-col justify-between',
          currentFile && 'translate-x-0',
        )}
        tabIndex={-1}
        ref={drawerRef}
      >
        {currentFile && (
          <>
            <div className="fixed top-1 right-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={(evt: MouseEvent<HTMLButtonElement>) => {
                  evt.preventDefault()
                  setCurrentFile(null)
                }}
              >
                <CloseIcon />
              </Button>
            </div>
            <h3 className="pt-10">{currentFile}</h3>
            <div className="w-full font-sans flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={(evt: any) => {
                  evt.preventDefault()
                  bootFile(data.current.uri, currentFile)
                }}
              >
                Boot
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={async (evt: any) => {
                  evt.preventDefault()
                  // TODO: alert to remove file
                  const toastId = toast.loading(`Deleting file`)
                  await deleteFile(data.current.uri, currentFile)
                  toast.success(`Deleted file`, {
                    id: toastId,
                  })
                  setCurrentFile(null)
                  // TODO: revalidate directory of the removed file
                  mutate(['readDirectory', '/', data.current.uri], undefined, {
                    revalidate: true,
                  })
                }}
              >
                Delete
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
