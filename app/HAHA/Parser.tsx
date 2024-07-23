'use client'

import HeadingMemo from "./Heading";
import ParagraphMemo from "./Paragraph";
import React from "react";

type Content = {
    key: number
    text: string
}

function Parser({content, focus}: { content: Content[], focus: [number, number] }) {


    return (
        <>
            {
                content.map((v, i) => {
                    if (v.text.startsWith('### ')) {
                        return <HeadingMemo key={v.key} focus={focus[0] <= i && i <= focus[1]} level={3} text={v.text.slice(4).replace(/ /g, '\u00a0')}/>
                    }
                    if (v.text.startsWith('## ')) {
                        return <HeadingMemo key={v.key} focus={focus[0] <= i && i <= focus[1]} level={2} text={v.text.slice(3).replace(/ /g, '\u00a0')}/>
                    }
                    if (v.text.startsWith('# ')) {
                        return <HeadingMemo key={v.key} focus={focus[0] <= i && i <= focus[1]} level={1} text={v.text.slice(2).replace(/ /g, '\u00a0')}/>
                    }


                    return <ParagraphMemo key={v.key} focus={focus[0] <= i && i <= focus[1]} text={v.text.replace(/ /g, '\u00a0')}/>
                })
            }
        </>
    )
}

const ParserMemo = React.memo(Parser)
export default ParserMemo;