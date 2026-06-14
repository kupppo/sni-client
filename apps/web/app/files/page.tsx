import styles from "../page.module.css";
import FileTree from "./tree";

export default function ControlsPage(): JSX.Element {
  return (
    <main className={styles.main}>
      <FileTree />
    </main>
  );
}
