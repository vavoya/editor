# VDOM 99% 기반으로 동작하는 React 용 Markdown WYSIWYG Editor
## 프로젝트 소개

## 기술 스택
- TypeScript
- React(NextJS)
- Module CSS

## 성능 비교
chrome 기준 제 에디터 vs draft.js 성능 사진입니다.

'ㅇㅇㅇ' 라인 입력을 테스트로 했습니다.

제 판단으로는 메모리 변화폭을 기준으로 draft.js와 큰 차이는 없습니다.
시간 관련해서는 제 에디터가 시스템 시간이 더 짧아 브라우저의 시스템 관련 동작이 최적화되어 있으며, 페인트 시간이 짧아 DOM 렌더링이 빠르기 때문에 빠른 사용자 경험을 제공할 수 있습니다.

단, 둘의 실행 환경이 100% 동일하다고 보긴 어렵기에 이 결과는 개인적인 견해임을 밝힙니다.


<img width="1492" alt="스크린샷 2025-03-17 오전 8 32 28" src="https://github.com/user-attachments/assets/738a8a20-c174-41b5-9fd1-0c76b9e99100" />
<img width="1494" alt="스크린샷 2025-03-17 오전 8 32 44" src="https://github.com/user-attachments/assets/393579f5-1c77-4c7b-ab42-487d2b76af72" />


## 테스트 링크
에디터 테스트는 [여기](https://editor-sandy.vercel.app/)에서 확인할 수 있습니다.
### 주의!!
**Safari** 환경을 기준으로 개발 되었으며, **Chrome** 으로 실행할 시 정상적인 동작이 발생하지 않을 수 있습니다. (확인 결과: Chrome에서는 마우스로 Caret 설정이 안될 뿐, 나머지는 정상 동작 합니다. 브라우저 API가 서로 다르기에 발생하는 것으로 추측됨. 로직상 그럼. 아 다른 오류도 존재하니 그냥 Safari로 테스트 하심이....)

## 주요 기능
- **텍스트 강조:** `**강조**`, `==하이라이트==`, `*기울기*`, `~~취소선~~`로 강조, 하이라이트, 기울기, 취소선 적용 가능
- **헤딩 지원:** #, ##, ###를 통해 3단계 헤딩 구조 지원
- **Caret 포커스 반응:** 커서 위치에 따라 마크다운 문법 자동 표시 및 숨김 처리
- **실시간 렌더링:** 입력 시 즉시 마크다운 파싱 및 렌더링
- **선택 및 삭제:** 마우스 및 Cmd + Shift + 방향키로 텍스트 선택 및 삭제 지원
- **IME 입력 지원:** 브라우저 API 기반 한국어 입력 지원, 다른 언어도 확장 가능
- **Caret 이동:** 커서 상하좌우 이동 가능, 정확한 위치 제어 가능
- **문단 단위로 reRender:** 불필요한 리렌더링을 방지하기 위해 문단 단위로만 변경 감지후 리렌더링
- **이스케이프 처리:** `\`를 사용하면 마크다운 문법 무시 가능 (예: `\*텍스트\*` → `*텍스트*`)

## 구현 설명
### 문단 파싱
에디터마다 HTML DOM 의 구조를 구성하는 방식은 다양합니다.

저는 DOM 깊이를 최소하기 위해, 그리고 최적화 하기 위해서 하나의 span 에 여러개의 스타일이 classname 으로 들어가게 만들었습니다.

```html
<span class="strikethrough highlight"></span>
```

이를 구현하기 위해, 문단을 읽을 때 텍스트 강조 문법에 따라서 스택에 추가되거나 삭제가 됩니다.

스택에 존재하는 문법이 다시 읽어지면 스택에서 지워지고, 없는 문법이 읽어지면 스택에 추가 됩니다.

이렇게 스택에 변경이 존재하면 새로운 span 으로 시작합니다.

세부 구현은 [여기서](https://github.com/vavoya/editor/blob/main/app/HAHA/Paragraph.tsx) 확인 가능합니다.

### 헤딩 파싱
문단의 시작이 `#공백` 으로 시작되면 문단 파싱이 아닌, 헤딩 파싱으로 시작합니다.

헤딩에는 텍스트 강조가 적용되지 않습니다.

```tsx
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
```

### Caret 포커스 반응
텍스트 강조 문법 구문은 개별 span 으로 본문의 내용과 element 가 분리되어있습니다.

따라서, 에디터로 부터 문단의 focus 여부를 전달받고, focus 여부에 따라서 문법 구분의 span의 class를 조정합니다.

focus 받는 문단이면 문법 구문이 그대로 표시되고, 아니면 문법 구문은 전부 숨겨집니다.

```tsx
// Paragraph.tsx
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
```

### 실시간 렌더링
외부에 숨겨진 contenteditable 요소를 두고, 그곳에 dom focus 를 항시 두게하여 입력을 받게 합니다.

DOM에 입력이 감지되면 React의 상태로 해당 이벤트 객체를 넘깁니다.

```tsx
function Input({setEventState, position}: {setEventState: Function, position: Rect}) {
    const ref = useRef<HTMLDivElement>(null)

    return (
        <div
            ref={ref}
            contentEditable={true}
            suppressContentEditableWarning={true}
            style={{
                outline: 'none',
                position: 'absolute',
                zIndex: 0,
                fontSize: `${position.height}px`,
                //visibility: 'hidden',
                height: `${position.height}px`,
                width: '0.01px',
                overflow: 'hidden',
                left: `${position.left}px`,
                top: `${position.top}px`,
                textOverflow: 'clip'
            }}
            id={'input'}
            onBlur={e => {
                const newEventState: EventState = {
                    type: 'blur'
                }
                setEventState(newEventState)
            }}
            onCompositionUpdate={useCallback((e: React.CompositionEvent<HTMLInputElement>) => {
                const newEventState: EventState = {
                    type: 'compositionUpdate',
                    compositionUpdate: {
                        data: e.nativeEvent.data
                    }
                }
                setEventState(newEventState)
            }, [setEventState])}
            onCompositionEnd={useCallback((e: React.CompositionEvent<HTMLInputElement>) => {
                const newEventState: EventState = {
                    type: 'compositionEnd',
                    compositionEnd: {
                        data: ''
                    }
                }
                setEventState(newEventState)
                // 내용 비우기
                if (ref.current) {
                    (ref.current as HTMLDivElement).textContent = ''
                }
            }, [setEventState])}
            onInput={useCallback((e: React.SyntheticEvent<HTMLInputElement, InputEvent>) => {
                const nativeEvent = e.nativeEvent as InputEvent;
                const newEventState: EventState = {
                    type: 'input',
                    input: {
                        inputType: nativeEvent.inputType,
                        data: nativeEvent.data ? nativeEvent.data : ''
                    }
                }
                setEventState(newEventState)
                // 내용 비우기
                if (!e.nativeEvent.isComposing && ref.current) {
                    (ref.current as HTMLDivElement).textContent = ''
                }
            }, [setEventState])}
            onKeyDown={useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
                const newEventState: EventState = {
                    type: 'keyDown',
                    keyDown: {
                        code: e.code,
                        metaKey: e.metaKey,
                        shiftKey: e.shiftKey
                    }
                }
                if (e.code === 'ArrowDown' || e.code === 'ArrowUp' || e.code === 'ArrowLeft' || e.code === 'ArrowRight') {
                    e.preventDefault()
                }
                setEventState(newEventState)
            }, [setEventState])}>{`\u200B`}</div>
    )
}
```

입력 객체가 전달이되면

에디터에서 이벤트를 분석하고 VDOM에 적용하는 과정을 거칩니다.

이후 Parser에 의해 파싱되어서 최종적으로 DOM에 적용됩니다.

```tsx
// 이벤트 처리 로직 일부
case 'input': {
                if ('input' in eventState) {
                    const e = eventState.input;
                    // 문자 입력만 처리
                    // 비 IME
                    if (e.inputType === 'insertText') {
                        const selection = internalState.current.selection;
                        const content = contents.content
                        if (selection.isCollapsed) {
                            const [index, offset] = selection.startOffset;
                            const newContent = [...content]
                            const text = content[index].text;
                            const char = e.data;
                            const line = {
                                key: content[index].key,
                                text: text.slice(0, offset) + char + text.slice(offset)
                            }
                            newContent.splice(index, 1, line)
                            setContents({
                                content: newContent,
                                maxIndex: contents.maxIndex
                            })
                            selection.setStartOffset([index, offset + char.length])
                            selection.collapse(true)
                        } else {
                            const startOffset = selection.startOffset;
                            const endOffset = selection.endOffset;
                            const text1 = content[startOffset[0]].text.slice(0, startOffset[1])
                            const text2 = content[endOffset[0]].text.slice(endOffset[1])
                            const char = e.data;
                            const line = {
                                key: content[startOffset[0]].key,
                                text: text1 + char + text2
                            }
                            const newContent = [...content]
                            newContent.splice(startOffset[0], endOffset[0] - startOffset[0] + 1, line)
                            setContents({
                                content: newContent,
                                maxIndex: contents.maxIndex
                            })
                            selection.setStartOffset([startOffset[0], startOffset[1] + char.length])
                            selection.collapse(true)
                        }

                    }
                }

                break
            }
```

### 선택 및 삭제
에디터 내부에는 아까와 마찬가지의 방식으로 방향키를 인식하고 또한 마우스 드래그를 인식합니다.

이로 Selection 객체를 브라우저와 구분하여 관리할 수 있고, Selection 범위에 따른 삭제를 진행할 수 있습니다.

```tsx
interface Selection {
    startOffset: Offset
    endOffset: Offset
    isFocusEnd: boolean
    isCollapsed: boolean
    collapse: (collapseToStart: boolean) => void
    setStartOffset: (startOffset: Offset) => void
    setEndOffset: (startOffset: Offset) => void
}
```

### IME 입력 지원
구현 로직을 전부 볼 필요 없습니다.

브라우저는 IME 입력이 발생하면 일단 DOM에 IME를 실시간으로 입력하며 IME 상태를 DOM을 기준으로 기억합니다.

그리고 IME 입력이 어떠한 이유(포커스 손실, 다음 문자, 스페이스 등)로 끝나면 기존 DOM에 있는 IME 조합을 지우고, 새로운 완전한 IME을 입력하는 이벤트(input)를 발생합니다.

이러한 동작은 브라우저마다 다르게 구현 되어있습니다. 따라서 모든 브라우저에 적용하기 위해서는 브라우저의 Composition 이벤트의 흐름을 이해해야 가능한 방법입니다.

이 에디터에는 IME 입력 도중에는 DOM에 직접적으로 기록되게 냅둡니다. 그래야 브라우저의 IME 조합 기능을 활용 할 수 있습니다.

이러한 입력은 그대로 VDOM으로 넘기고 Caret 조정과 같은 작업을 합니다.

IME 입력이 종료되면 input 이벤트가 새로 발생합니다. input 이벤트 중에 IME 종료로 발생하는 입력을 분류해서 무시하도록 합니다.

모든 IME 입력은 그 길이에 따라 Caret을 조절하게 해서 Caret 또한 IME 입력에 맞게 자동으로 맞춰집니다.

Safari 와 Chrome의 IME 처리 순서가 다르기에 주의해야합니다. 현재는 Safari에 맞춰져 있습니다.

```tsx
case 'compositionUpdate': {
                if ('compositionUpdate' in eventState) {
                    const e = eventState.compositionUpdate
                    const selection = internalState.current.selection;
                    const content = contents.content;
                    if (selection.isCollapsed) {
                        const [index, offset] = selection.startOffset;
                        const newContent = [...content]

                        const text = content[index].text;
                        const char = e.data

                        const newText = text.slice(0, offset - internalState.current.IME.IMELength) + char + text.slice(offset);
                        selection.setStartOffset([index, offset - internalState.current.IME.IMELength + char.length])
                        selection.collapse(true)
                        internalState.current.IME.IMELength = char.length;
                        internalState.current.IME.IMEState = true;
                        newContent.splice(index, 1, {
                            key: content[index].key,
                            text: newText
                        });
                        setContents({
                            content: newContent,
                            maxIndex: contents.maxIndex
                        })
                    } else {
                        const startOffset = selection.startOffset;
                        const endOffset = selection.endOffset;
                        const text1 = content[startOffset[0]].text.slice(0, startOffset[1])
                        const text2 = content[endOffset[0]].text.slice(endOffset[1])
                        const char = e.data;
                        internalState.current.IME.IMELength = char.length;
                        internalState.current.IME.IMEState = true;
                        const line = {
                            key: content[startOffset[0]].key,
                            text: text1 + char + text2
                        }
                        const newContent = [...content]
                        newContent.splice(startOffset[0], endOffset[0] - startOffset[0] + 1, line)
                        setContents({
                            content: newContent,
                            maxIndex: contents.maxIndex
                        })
                        selection.setStartOffset([startOffset[0], startOffset[1] + char.length])
                        selection.collapse(true)
                    }

                }

                break
            }
            case 'compositionEnd': {
                internalState.current.IME.IMELength = 0;
                internalState.current.IME.IMEState = false;
                break
            }
```

### Caret 이동
에디터에 Caret의 이동 또한 중요합니다.

마우스로 인한 Caret의 이동은 브라우저 API를 사용하여 dom 기준 Range를 얻고, 그것을 VDOM offset으로 변환하는 과정을 거칩니다.
```tsx
onMouseDown={e => {
                const selection = internalState.current.selection;
                let range;
                let index;
                let offset;
                if ('caretPositionFromPoint' in document) {
                    //range = document.caretPositionFromPoint(e.clientX, e.clientY);
                } else if ('caretRangeFromPoint' in document) {
                    // Use WebKit-proprietary fallback method
                    range = document.caretRangeFromPoint(e.clientX, e.clientY) as Range;
                    [index, offset] = getOffsetByRange(range)
                    selection.setStartOffset([index, offset])
                    selection.collapse(true)
                } else {
                    // Neither method is supported, do nothing
                    return;
                }
```

키보드로 인한 이동인 경우, 좌우 이동은 단순하게 offset을 기반으로 문단을 이동하거나, 기존 문단의 현재 위치의 좌우를 이동하는 정도입니다.

그리고 상하 이동의 경우, 시작 위치의 x 좌표를 기억하고 연속적인 상하 이동의 경우 시작점 x를 기준으로 Caret의 offset을 계속 position 기준으로 탐색하며 결정해야합니다.

해당 탐색을 최적화 할려고 했지만, 딱히 특화된 탐색 알고리즘이 안떠올랐으며, 그냥 현재 기준 좌우로 읽으면서 탐색해도 크게 문제 없을 것 같기에 그렇게 구현했습니다.

```tsx
const getCaretUpOffset = (index: number, offset: number, content: Content[], verticalCaret: VerticalCaret): Offset | null => {
    const range = getRangeByOffset(index, offset);
    const node = range.startContainer;

    if (node.nodeType === Node.TEXT_NODE || (node.nodeType === Node.ELEMENT_NODE && (node as HTMLElement).tagName === 'SPAN')) {
        const rect = getRectByRange(range);
        let startX = rect.x;
        let currentX = startX;
        if (verticalCaret.isCached) {
            startX = verticalCaret.x
        } else {
            verticalCaret.isCached = true;
            verticalCaret.x = startX;
        }
        let lineCount = 0;

        let prevIndex = index;
        let prevOffset = offset;

        let changeP = false

        // offset 을 감소시키면서 탐색
        while (true) {
            changeP = false
            if (0 < offset) {
                // 문단 내에서 처리
                offset -= 1;
            } else if (0 < index) {
                // 문단 이동
                offset = content[index - 1].text.length;
                index -= 1;
                changeP = true;
                lineCount += 1;
            } else {
                // 문서의 처음으로 도착
                return [0, 0]
            }

            const newRange = getRangeByOffset(index, offset);
            const newRect = getRectByRange(newRange);
            const newX = newRect.x

            // 줄바꿈 확인
            if (currentX < newX && !changeP) {
                lineCount += 1;
            }

            // 조건 만족
            if (newX <= startX && lineCount === 1) {
                return [index, offset]
            }
            if (lineCount === 2) {
                return [prevIndex, prevOffset];
            }

            // X값 최신화
            currentX = newX;
            prevIndex = index;
            prevOffset = offset;
        }
    }

    return null;
}
```

### 문단 단위로 reRender
모든 문단과 헤딩에는 React.memo가 적용되어있습니다. 그리고 해당 컴포넌트들은 문자열을 props로 전달 받습니다.

따라서, 전달받는 문자열이 바뀌지 않는 이상 리렌더링은 발생하지 않습니다. 이에 따라, 자동으로 포커싱된 문단만(입력받은 문단만) 리렌더링되고 파싱되는 최적화를 구현했습니다.

### 이스케이프 처리
마크다운하면 특수문자를 구문으로 사용하게 됩니다. 하지만 특수문자를 그대로 써야하는 경우도 있습니다.

이를 위해 이스케이프로 특수문자를 렌더링할 수 있게 했습니다.
```tsx
// Paragrpah.tsx
if (text1 === '\\') {
            let textData = getTextData()
            if (textData) addTextRun(textData);
            addSyntaxTextRun('\\')
            textData = text[right + 1]
            if (textData) addTextRun(textData);
            left = right += 1 + textData?.length;
            continue
        }
```


## 후기
막상 개발할 때는 엄청 머리 싸매고, 계속 구글링하고 유튜브에도 검색하고 그랬는데, 구현한지 반년 이후에 리드미를 작성하면서 다시 보니깐  생각보다 쉽게 구현한 것 같네요.

시작할 땐 어려웠던 것이, 끝나고 나면 쉬워보이는 일이 자주 있어서 불안하긴 합니다.

그래도 일단 이 프로젝트는 완전한 커스텀 라이브러리로 만드는 것이 목표였기에, 새로 레파지토리를 구성한 다음에 이어서 작업할 예정입니다.

코드를 다시 돌아보면서 설명 쓰는게 힘들....



# 마크다운 파서 제작 여정
```ts
import {Lines, RootBlock} from "./types";
import resolveTargetBlock from "./resolveTargetBlock";

function testResolveTargetBlock(t: number) {
    const rootBlock: RootBlock = { type: 'rootBlock', children: [] };
    const lines: Lines = [];

    const buildIncrementalText = (i: number) => {
        const alphabet = 'abcdefghijklmnopqrstuvwxyz';
        let result = '';
        for (let j = 0; j < i; j++) {
            result += alphabet[j % 26];
        }
        return result;
    };

    for (let i = 0; i < 500; i++) {
        const suffix = buildIncrementalText(0);  // 점점 길어지는 문자열

        lines.push(`# He**ad**in*g ${suffix}`);
        lines.push(`Some p**arag*raph** text number ${suffix}`);
        lines.push(`- Item ${suffix}`);
        lines.push(`  - Subitem ${suffix}`);
        lines.push(`    - SubSubitem ${suffix}`);
        lines.push(`> Quote level 1 ${suffix}`);
        lines.push(`> > Quote level 2 ${suffix}`);
        lines.push(`> > > Quote level 3 ${suffix}`);
        lines.push("```js");
        lines.push(`const index = ${0 + i};`);
        lines.push(`console.log(index);`);
        lines.push("```");
        lines.push(`Paragraph after code block ${suffix}`);
        lines.push(`---`);
    }
    lines.push("2".repeat(t))
    const startTime = performance.now();
    let currentIndex = 0;
    while (currentIndex < lines.length) {
        resolveTargetBlock(rootBlock, lines[currentIndex]);
        currentIndex++;
    }
    const endTime = performance.now();
    console.log(`[${t}] Execution time: ${(endTime - startTime).toFixed(3)} ms`);
}



setTimeout(() => {
    for (let i = 0; i < 100; i++) {
        //const startTime = performance.now();
        testResolveTargetBlock(i);  // i를 기반으로 lines 내용이 바뀌게
        //const endTime = performance.now();
        //console.log(`[${i}] Execution time: ${(endTime - startTime).toFixed(3)} ms`);
    }
}, 1000);

```
해당 코드 실행하면 첫 실행은 150ms, 그 외에는 2~3ms 를 보여준다.   
commomMark에서 제공하는 파서와 비교 결과. commomMark는 입력에 대한 평균 4ms 시간을 보여준다.

첫 실행이 아쉽지만, 실시간 파싱 상황에서는 상용 라이브러리 성능 까지는 끌어올린 듯 하다.   
내부적으로 인라인 캐시를 관리하고 적용한 것이 꽤 큰 효과가 있었다.

\*\* 같은 일반적인 인라인 파싱은 미미했지만, 코드 블럭 인라인의 경우 캐시를 하고 안하고의 시간 차이가 배로 차이가 났다.


