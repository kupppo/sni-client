'use client'

import { useSNI } from '@/lib/sni'
import { FileIcon, FolderIcon, FolderOpen, MinusSquare, PlusSquare } from 'lucide-react'
import { useCallback, useState } from 'react'
import { MouseEvent } from 'react'
import { cn } from '@/lib/utils'

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

function File({ name, depth }: { depth: number; name: string }) {
  // For depth, insert indents
  return (
    <li className={'whitespace-nowrap relative'}>
      <div className={cn('flex items-center')}>
        {depth > 0 ? <Indents depth={depth} /> : <div className="w-8" />}
        <div className={cn('ml-4', 'pl-0.5', 'mr-2')}>
          <FileIcon size={18} strokeWidth={1} />
        </div>
        <span className={cn('text-md')}>{name}</span>
      </div>
    </li>
  )
}

function Folder({
  name,
  depth = 0,
  path,
  uri,
}: {
  name: string
  depth: number
  path: string
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
      {open && <FileTree path={path} uri={uri} depth={depth + 1} />}
    </li>
  )
}

function FileTree({
  uri,
  path = '/',
  depth = 0,
}: {
  uri: string
  path: string
  depth?: number
}): JSX.Element {
  const { data, isLoading, error } = useSNI(['readDirectory', path, uri])

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
    <ul className={cn('list-none')}>
      {folders.map((folder: any) => (
        <Folder key={folder.path} {...folder} depth={depth} uri={uri} />
      ))}
      {files.map((file: any) => (
        <File key={file.path} depth={depth} {...file} />
      ))}
    </ul>
  )
}

export default function FileTreeWrapper(): JSX.Element | null {
  const data = useSNI('devices', { refreshInterval: 50 })
  const connected = data?.connected
  if (!connected) {
    return null
  }
  return (
    <div className="w-full font-mono">
      <div className={cn('border-t border-zinc-50 px-4 py-4')} />
      <FileTree uri={data.current.uri} path="/" />
    </div>
  )
}
