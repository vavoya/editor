import React from "react";
import styles from "./haha.module.css"

function Heading({focus, level, text}: {focus: boolean, level: number, text: string}) {
    switch (level) {
        case 1:
            return (
                <h1 className={focus ? styles.focus : ''}>
                    <span className={styles.syntax}>{focus ? '#\u00a0' : '\u200B\u200B'}</span><span style={{wordBreak: 'break-all'}}>{text}</span>
                </h1>
            );
        case 2:
            return (
                <h2 className={focus ? styles.focus : ''}>
                    <span className={styles.syntax}>{focus ? '##\u00a0' : '\u200B\u200B\u200B'}</span><span style={{wordBreak: 'break-all'}}>{text}</span>
                </h2>
            );
        case 3:
            return (
                <h3 className={focus ? styles.focus : ''}>
                    <span className={styles.syntax}>{focus ? '###\u00a0' : '\u200B\u200B\u200B\u200B'}</span><span style={{wordBreak: 'break-all'}}>{text}</span>
                </h3>
            );
        default:
            return null;
    }
}

const HeadingMemo = React.memo(Heading)
export default HeadingMemo