'use client'

import {
  X as CloseIcon,
  FileIcon,
  FolderIcon,
  FolderOpen,
  MinusSquare,
  PlusSquare,
} from 'lucide-react'
import {
  type MouseEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import { useDropzone } from 'react-dropzone'
import { toast } from 'sonner'
import { useSWRConfig } from 'swr'
import SNIError from '@/components/sniError'
import { Button } from '@/components/ui/button'
import { SNI, useSNI } from '@/lib/sni'
import { cn } from '@/lib/utils'

const Indents = ({ depth }: { depth: number }) => (
  <div className="ml-7 flex">
    {Array.from({ length: depth }, (_value, index) => (
      <div
        className={cn('relative left-2 block h-6 w-8')}
        key={index}
        style={{
          background:
            'linear-gradient(to right,transparent 18.5px,#333 18.5px,#333 19.5px,transparent 19.5px)',
          backgroundRepeat: 'no-repeat',
          verticalAlign: 'top',
        }}
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
    [setCurrentFile]
  )
  // For depth, insert indents
  return (
    <li className={'relative whitespace-nowrap'}>
      <div className={cn('flex items-center')}>
        {depth > 0 ? <Indents depth={depth} /> : <div className="w-8" />}
        <Button onClick={handleClick} size="plain" variant="plain">
          <div className={cn('ml-4', 'pl-0.5', 'mr-2')}>
            <FileIcon size={18} strokeWidth={1} />
          </div>
          <span className={cn('pr-4 text-base')}>{name}</span>
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
  const { mutate } = useSWRConfig()
  const [open, setOpen] = useState(false)
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    noClick: true,
    noDragEventsBubbling: true,
    onDrop: async (acceptedFiles) => {
      const file = acceptedFiles[0] as File
      const contents = await readFile(file)
      const toastId = toast.loading(`Adding ${file.name} into ${path}`, {
        duration: Number.POSITIVE_INFINITY,
      })
      let basePath = path
      if (!basePath.endsWith('/')) {
        basePath += '/'
      }
      const destination = `${basePath}${file.name}`
      await SNI.putFile(uri, destination, contents)

      // revalidate directory to show new file
      mutate(['readDirectory', path, uri])
      toast.success(`Added ${file.name}`, {
        id: toastId,
        duration: 4500,
      })
    },
  })
  const handleOpen = useCallback(
    (evt: MouseEvent<HTMLButtonElement>) => {
      evt.preventDefault()
      setOpen(!open)
    },
    [open, setOpen]
  )

  const handleDrag = useCallback(() => {
    if (isDragActive && !open) {
      setOpen(true)
    }
  }, [isDragActive, open, setOpen])

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>
    if (isDragActive) {
      timer = setTimeout(() => {
        handleDrag()
      }, 700)
    }
    return () => {
      if (timer) {
        clearTimeout(timer)
      }
    }
  }, [handleDrag, isDragActive])

  return (
    <li {...getRootProps()} className={cn('relative whitespace-nowrap')}>
      <input {...getInputProps()} />
      <button className={cn('flex items-center')} onClick={handleOpen}>
        {depth > 0 ? <Indents depth={depth} /> : <div className="w-8" />}
        <div className={cn('absolute')}>
          {open ? (
            <MinusSquare size={14} strokeWidth={2} />
          ) : (
            <PlusSquare size={14} strokeWidth={2} />
          )}
        </div>
        <div
          className={cn(
            'flex items-center',
            isDragActive && 'bg-connected text-background'
          )}
        >
          <div className={cn('mr-2 ml-4')}>
            {open ? (
              <FolderOpen size={20} strokeWidth={1} />
            ) : (
              <FolderIcon size={20} strokeWidth={1} />
            )}
          </div>
          <span className={cn('pr-4 text-base')}>{name}</span>
        </div>
      </button>
      {open && (
        <FileTree
          depth={depth + 1}
          path={path}
          setCurrentFile={setCurrentFile}
          uri={uri}
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
  const { mutate } = useSWRConfig()
  const { data, isLoading, error } = useSNI(['readDirectory', path, uri])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    noClick: true,
    noDragEventsBubbling: true,
    onDrop: async (acceptedFiles) => {
      const file = acceptedFiles[0] as File
      const contents = await readFile(file)
      const toastId = toast.loading(`Adding ${file.name} into ${path}`, {
        duration: Number.POSITIVE_INFINITY,
      })
      let basePath = path
      if (!basePath.endsWith('/')) {
        basePath += '/'
      }
      const destination = `${basePath}${file.name}`
      await SNI.putFile(uri, destination, contents)

      // revalidate directory to show new file
      mutate(['readDirectory', path, uri])
      toast.success(`Added ${file.name}`, {
        id: toastId,
        duration: 4500,
      })
    },
  })

  if (error) {
    console.error(error)
  }

  if (isLoading || !data) {
    return <div />
  }

  if (data.length === 0) {
    return (
      <ul className={cn('list-none')}>
        <li className={'relative whitespace-nowrap'}>
          <div className={cn('flex items-center')}>
            {depth > 0 ? <Indents depth={depth} /> : <div className="w-8" />}
            <div className={cn('ml-5 text-base italic opacity-50')}>Empty</div>
          </div>
        </li>
      </ul>
    )
  }

  const folders = data.filter((entry: any) => entry.type === 0)
  const files = data.filter((entry: any) => entry.type === 1)

  return (
    <div {...getRootProps()} className={cn(isDragActive && 'bg-zinc-800')}>
      <input {...getInputProps()} />
      <ul className={cn('list-none')}>
        {folders.map((folder: any) => (
          <Folder
            key={folder.path}
            {...folder}
            depth={depth}
            setCurrentFile={setCurrentFile}
            uri={uri}
          />
        ))}
        {files.map((file: any) => (
          <File
            depth={depth}
            key={file.path}
            path={file.path}
            setCurrentFile={setCurrentFile}
            {...file}
          />
        ))}
      </ul>
    </div>
  )
}

async function readFile(file: File): Promise<Uint8Array> {
  const reader = new FileReader()
  return new Promise((resolve, reject) => {
    reader.onload = async () => {
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
    reader.onerror = () => {
      toast.error('Failed to load file')
    }
    reader.readAsArrayBuffer(file)
  })
}

export function Drawer({
  currentFile,
  setCurrentFile,
  uri,
}: {
  currentFile: string | null
  // eslint-disable-next-line no-unused-vars
  setCurrentFile: (_path: string | null) => void
  uri: string
}) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const drawerRef = useRef<HTMLDivElement>(null)
  const { mutate } = useSWRConfig()
  const isOpen = !!currentFile

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

  // Reset confirm delete state when drawer is closed
  //   or the current file changes
  useEffect(() => {
    setConfirmDelete(false)
  }, [currentFile, setConfirmDelete])

  return (
    <div
      className={cn(
        'fixed top-0 right-0 z-50 flex h-screen w-96 translate-x-full flex-col justify-between overflow-y-auto border-zinc-900 border-l bg-zinc-950 p-4 transition-transform',
        currentFile && 'translate-x-0'
      )}
      ref={drawerRef}
      tabIndex={-1}
    >
      {isOpen && (
        <>
          <div className="fixed top-1 right-1">
            <Button
              onClick={(evt: MouseEvent<HTMLButtonElement>) => {
                evt.preventDefault()
                setCurrentFile(null)
              }}
              size="icon"
              variant="ghost"
            >
              <CloseIcon />
            </Button>
          </div>
          <h3 className="pt-10">{currentFile}</h3>
          <div className="w-full font-sans">
            <div
              className={cn(
                'pb-4 text-center text-destructive text-sm',
                !confirmDelete && 'hidden'
              )}
            >
              Are you sure you want to delete this file?
            </div>
            <div className="flex w-full gap-3">
              <Button
                className="flex-1"
                onClick={(evt: any) => {
                  evt.preventDefault()
                  SNI.bootFile(uri, currentFile)
                }}
                variant="outline"
              >
                Boot file
              </Button>
              <Button
                className="flex-1"
                onClick={async (evt: any) => {
                  evt.preventDefault()
                  if (confirmDelete) {
                    const toastId = toast.loading('Deleting file')
                    await SNI.deleteFile(uri, currentFile)
                    toast.success('Deleted file', {
                      id: toastId,
                      duration: 3000,
                    })
                    setCurrentFile(null)
                    // revalidate directory of the removed file
                    mutate(['readDirectory', '/', uri])
                    setConfirmDelete(false)
                  } else {
                    setConfirmDelete(true)
                  }
                }}
                variant="destructive"
              >
                {confirmDelete ? 'Confirm delete' : 'Delete file'}
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default function FileTreeWrapper(): JSX.Element | null {
  const { mutate } = useSWRConfig()
  const data = useSNI('devices', { refreshInterval: 50 })
  const currentScreen = useSNI(['currentScreen', data?.current?.uri], {
    refreshInterval: 200,
  })

  const inputRef = useRef<HTMLInputElement>(null)
  const [currentFile, setCurrentFile] = useState<string | null>(null)

  const handleFileChange = useCallback(
    async (evt: any) => {
      const file = evt.target.files[0]
      const toastId = toast.loading(`Adding ${file.name}`, {
        duration: Number.POSITIVE_INFINITY,
      })
      const fileContents = await readFile(file)
      await SNI.putFile(data.current.uri, file.name, fileContents)

      // revalidate directory to show new file
      mutate(['readDirectory', '/', data.current.uri])
      toast.success(`Added ${file.name}`, {
        id: toastId,
        duration: 4500,
      })
    },
    [data.current]
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
    (capability: string) => data.current.capabilities.includes(capability)
  )

  if (!hasRequiredCapabilities) {
    const err = new Error('Missing Filesystem Capabilities')
    return <SNIError error={err} />
  }

  return (
    <div className="w-full font-mono">
      <div className={cn('border-zinc-800 border-t px-4 py-4')} />
      <FileTree
        path="/"
        setCurrentFile={setCurrentFile}
        uri={data.current.uri}
      />
      <div className={cn('mt-8 border-zinc-900 border-t py-4 font-sans')}>
        <div className="flex gap-3">
          <Button
            onClick={(evt) => {
              evt.preventDefault()
              inputRef.current?.click()
            }}
            variant="default"
          >
            Add File
          </Button>
          {currentScreen?.data === 'game' && (
            <>
              <Button
                onClick={(evt) => {
                  evt.preventDefault()
                  SNI.resetSystem(data.current.uri)
                }}
                variant="outline"
              >
                Reset Game
              </Button>
              <Button
                onClick={(evt) => {
                  evt.preventDefault()
                  SNI.resetToMenu(data.current.uri)
                }}
                variant="outline"
              >
                Reset to Menu
              </Button>
            </>
          )}
          <input
            className="visually-hidden"
            onChange={handleFileChange}
            ref={inputRef}
            type="file"
          />
        </div>
      </div>
      <Drawer
        currentFile={currentFile}
        setCurrentFile={setCurrentFile}
        uri={data.current.uri}
      />
    </div>
  )
}
