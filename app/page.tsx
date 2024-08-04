import Image from "next/image";
import styles from "./page.module.css";
import NewEditor from "./HAHA/Test"
import ParserMemo from "./HAHA/Parser"

export default function Home() {
  return (
    <main className={styles.main}>
      <NewEditor
          initialContent={[
            {
              key: 0,
              text: "허동영 텍스트 텍스트 텍스트텍스트 텍스트 텍스트 텍스트 텍스트 텍스트 텍스트 텍스트 텍스트 텍스트 텍스트 텍스트 "
            },
            {
              key: 1,
              text: "텍스트 텍스트 텍스트 텍스트텍스트 텍스트 텍스트 텍스트 텍스트 텍스트 텍스트 텍스트 텍스트 텍스트 텍스트 텍스트 "
            },
            {
              key: 2,
              text: "텍스트 텍스트 텍스트 텍스트텍스트 텍스트 텍스트 텍스트 텍스트 텍스트 텍스트 텍스트 텍스트 텍스트 텍스트 텍스트 "
            },
            {
              key: 3,
              text: "텍스트 텍스트 텍스트 텍스트텍스트 텍스트 텍스트 텍스트 텍스트 텍스트 텍스트 텍스트 텍스트 텍스트 텍스트 텍스트 "
            },
            {
              key: 4,
              text: "텍스트 텍스트 텍스트 텍스트텍스트 텍스트 텍스트 텍스트 텍스트 텍스트 텍스트 텍스트 텍스트 텍스트 텍스트 텍스트 "
            },
            {
              key: 5,
              text: ""
            },
            {
              key: 6,
              text: "# 텍스트 텍스트 텍스트 텍스트텍스트 텍스트 텍스트 텍스트 텍스트 텍스트 텍스트 텍스트 텍스트 텍스트 텍스트 텍스트 "
            },
            {
              key: 7,
              text: "9"
            }
          ]}
          ParserComponent={ParserMemo}/>
    </main>
  );
}
