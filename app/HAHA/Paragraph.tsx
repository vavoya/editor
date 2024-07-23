import React, {RefObject, useRef} from 'react';
import styles from "./haha.module.css"

interface TextStyleType {
    [key: string]: boolean | string;
    bold: boolean;
    italic: boolean;
    strikethrough: boolean;
    highlight: boolean;
}

interface TextRunType extends TextStyleType {
    text: string;
    syntax: boolean;
}

const parseText = (text: string): TextRunType[] => {
    let left = 0;
    let right = 0;
    const textRunArray: TextRunType[] = [];
    const currentTextStyle: TextStyleType = {
        bold: false,
        italic: false,
        strikethrough: false,
        highlight: false,
    };

    const delimiter = {
        bold: ['**'],
        italic: ['*'],
        strikethrough: ['~~'],
        highlight: ['=='],
    }

    const addTextRun = (textData: string) => {
        textRunArray.push({ text: textData, syntax: false,...currentTextStyle });
    };

    const addSyntaxTextRun = (textData: string) => {
        textRunArray.push({ text: textData, syntax: true,...currentTextStyle });
    }

    const getTextData = () => {
        if (left < right) {
            return text.slice(left, right)
        }
        return null
    }

    if (text.length === 0) {
        addTextRun("");
        return textRunArray
    }

    while (right < text.length) {
        let text2 = text[right] + text[right + 1];
        let text1 = text[right];

        const processDelimiter = (type: string, delimiter: string) => {
            if (currentTextStyle[type]) {
                const textData = getTextData()
                if (textData) addTextRun(textData);

                addSyntaxTextRun(delimiter)
                currentTextStyle[type] = false
            } else {
                const textData = getTextData()
                if (textData) addTextRun(textData);

                currentTextStyle[type] = true
                addSyntaxTextRun(delimiter)
            }
            left = right += delimiter.length;
        }

        if (text1 === '\\') {
            addSyntaxTextRun('\\')
            const textData = text[right + 1]
            console.log(textData)
            if (textData) addTextRun(textData);
            left = right += 1 + textData.length;
            continue
        }



        if (text2 === delimiter.bold[0]) {
            processDelimiter('bold', delimiter['bold'][0])
        } else if (text1 === delimiter.italic[0]) {
            processDelimiter('italic', delimiter['italic'][0])
        } else if (text2 === delimiter.strikethrough[0]) {
            processDelimiter('strikethrough', delimiter['strikethrough'][0])
        } else if (text2 === delimiter.highlight[0]) {
            processDelimiter('highlight', delimiter['highlight'][0])
        } else {
            right++;
        }
    }

    if (left < right) {
        const textData = text.slice(left, right);
        addTextRun(textData);
    }

    return textRunArray;
};

const renderTextRuns = (textRunArray: TextRunType[], focus: boolean) => {

    return textRunArray.map((textRun: TextRunType, index: number) => {
        const syntax = textRun.syntax

        const className = `
                    ${textRun.bold ? 'bold' : ''} 
                    ${textRun.italic ? 'italic' : ''} 
                    ${textRun.strikethrough ? 'strikethrough' : ''} 
                    ${textRun.highlight ? 'highlight' : ''}
                    `.trim();

        if (syntax) {
            return (
                <span style={{wordBreak: 'break-all'}}
                      key={textRun.text ? index : -index}
                      className={`${className} ${styles.syntax}`}>{focus ? textRun.text : textRun.text.replace(/./g, '\u200B')}</span>
            )
        }

        return (
            <span style={{wordBreak: 'break-all'}} key={textRun.text ? index : -index} className={className}>{textRun.text ? textRun.text : <br/>}</span>
        )
    })
};

function Paragraph({text, focus}: { text: string, focus: boolean }) {

    const textRunArray = parseText(text);

    return (
        <p style={{
            marginTop: '1rem', /* 상단 여백 추가 */
            marginBottom: '1rem' /* 하단 여백 추가 */
        }}
           className={focus ? styles.focus : ''}
        >
            {
                renderTextRuns(textRunArray, focus)
            }
        </p>
    );
}

const ParagraphMemo = React.memo(Paragraph);
export default ParagraphMemo;

