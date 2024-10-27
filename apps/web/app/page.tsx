import DeviceView from './device'
import styles from './page.module.css'

import type { JSX } from "react";

export default function HomePage(): JSX.Element {
  return (
    <main className={styles.main}>
      <DeviceView />
    </main>
  )
}
