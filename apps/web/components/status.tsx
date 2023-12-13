'use client'

import { VariantProps, cva } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import styles from './status.module.css'
import { useEffect, useState } from 'react'

export interface StatusProps extends VariantProps<typeof dotVariants> {
  label?: string
}

const dotVariants = cva(styles.base, {
  variants: {
    size: {
      small: styles.small,
      medium: styles.medium,
    },
    status: {
      connected: styles.connected,
      disconnected: styles.disconnected,
      error: styles.error,
      pending: styles.pending,
    },
  },
})

const Status = ({ label, status, size }: StatusProps) => {
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
    }, 100)
  }, [label])
  useEffect(() => {
    setMounted(true)
  }, [])
  return (
    <div
      className={cn(
        dotVariants({ status, size }),
        loading && styles.loading,
        mounted && styles.mounted,
      )}
    >
      <span className={styles.dot} />
      {label && (
        <span key={label} className={styles.label}>
          {label}
        </span>
      )}
    </div>
  )
}

export default Status
