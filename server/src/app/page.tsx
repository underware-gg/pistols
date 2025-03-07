import Image from "next/image";
import styles from "./page.module.css";

export default function Home() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <a href="https://underware.gg">
          <Image
            // className={styles.logo}
            src="/underware.png"
            alt="Underware"
            width={500}
            height={500}
            priority
          />
        </a>
      </main>
    </div>
  );
}
