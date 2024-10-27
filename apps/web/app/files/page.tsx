import FileTree from './tree'
import styles from '../page.module.css'

import type { JSX } from "react";

export default function ControlsPage(): JSX.Element {
  return (
    <main className={styles.main}>
      <FileTree />
    </main>
  )
}
