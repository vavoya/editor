'use client'

import React, {useCallback, useEffect, useLayoutEffect, useRef, useState} from "react";
import useResizeObserver from "./resize";
import styles from "./haha.module.css"


interface EventStateBase {
    type: string;
}
interface InputEventState extends EventStateBase {
    input: {
        inputType: string;
        data: string;
    };
}
interface KeyDownEventState extends EventStateBase {
    keyDown: {
        code: string;
        metaKey: boolean;
        shiftKey: boolean;
    };
}
interface CompositionUpdateEventState extends EventStateBase {
    compositionUpdate: {
        data: string;
    };
}
interface CompositionEndEventState extends EventStateBase {
    compositionEnd: {
        data: string;
    };
}
type EventState =
    | EventStateBase
    | InputEventState
    | KeyDownEventState
    | CompositionUpdateEventState
    | CompositionEndEventState;



interface IME {
    IMEState: boolean,
    IMELength: number
}
interface VerticalCaret {
    x: number,
    isCached: boolean
}
type Offset = [number, number]
interface Selection {
    startOffset: Offset
    endOffset: Offset
    isFocusEnd: boolean
    isCollapsed: boolean
    collapse: (collapseToStart: boolean) => void
    setStartOffset: (startOffset: Offset) => void
    setEndOffset: (startOffset: Offset) => void
}
interface InternalState {
    IME: IME,
    verticalCaret: VerticalCaret,
    selection: Selection,
}

interface Content {
    key: number
    text: string
}
interface Contents {
    content: Content[],
    maxIndex: number
}

interface Rect {
    left: number,
    top: number,
    height: number
}
interface SelectionPosition {
    startRect: Rect
    endRect: Rect
    isCollapsed: boolean
}
interface RenderState {
    contents: Contents[]
    selectionPosition: SelectionPosition
    resize: number
}


export default function Test({initialContent, ParserComponent}: {initialContent: Content[], ParserComponent: React.ComponentType<any>}) {
    // 컴포넌트가 참조하는 렌더링 요소들
    const [contents, setContents] = useState<Contents>({
        content: initialContent,
        maxIndex: initialContent.length,
    })
    const [selectionPosition, setSelectionPosition] = useState<SelectionPosition>({
        startRect: {
            left: 0,
            top: 0,
            height: 0,
        },
        endRect: {
            left: 0,
            top: 0,
            height: 0,
        },
        isCollapsed: false
    })
    const [focusRange, setFocusRange] = useState<[number, number]>([0, 0])
    const [focusState, setFocusState] = useState<boolean>(false)
    const [eventState, setEventState] = useState<EventState>({type: '',})
    const [resizeState, setResizeState] = useState<[number]>([0])
    const resizeRef: React.RefObject<HTMLDivElement> = useResizeObserver(useCallback(() => {
        setResizeState([0])
    },[]))

    // 렌더링에 간접적인 요소들
    const internalState = useRef<InternalState>({
        IME: {
            IMEState: false,
            IMELength: 0,
        },
        verticalCaret: {
            x: 0,
            isCached: false,
        },
        selection: {
            startOffset: [0, 0],
            endOffset: [0, 0],
            isFocusEnd: false,
            isCollapsed: true,
            collapse: function(collapseToStart: boolean) {
                if (collapseToStart) {
                    this.endOffset = this.startOffset;
                } else {
                    this.startOffset = this.endOffset;
                }
                this.isCollapsed = true;
                this.isFocusEnd = false;
            },
            setStartOffset: function(startOffset: Offset) {
                this.startOffset = startOffset;
                this.isCollapsed = this.startOffset[0] === this.endOffset[0] && this.startOffset[1] === this.endOffset[1];
                this.isFocusEnd = !this.isCollapsed;
            },
            setEndOffset: function(endOffset: Offset) {
                this.endOffset = endOffset;
                this.isCollapsed = this.startOffset[0] === this.endOffset[0] && this.startOffset[1] === this.endOffset[1];
                this.isFocusEnd = !this.isCollapsed;
            }
        }

    })



    const updateFocusRange = useCallback((selection: Selection) => {
        setFocusRange([selection.startOffset[0], selection.endOffset[0]]);
    }, [])

    /**
     * selection.isFocusEnd 가 true 이면 startOffset 을 기준으로 구한 새 offset 을 props 로
     *
     * selection.isFocusEnd 가 false 이면 endOffset 을 기준으로 구한 새 offset 을 props 로
     *
     * 마우스 드래그의 경우에는 마우스 기준 offset 으로 만 넣어주면 됨
     */
    const updateSelectionFocusEnd = useCallback((endOffset: Offset, selection: Selection) => {
        const [index, offset] = endOffset;
        if (selection.startOffset[0] < index || (selection.startOffset[0] === index && selection.startOffset[1] < offset)) {
            selection.setEndOffset([index, offset]);
            selection.isFocusEnd = true;
        } else if (selection.startOffset[0] === index && selection.startOffset[1] === offset) {
            selection.collapse(true);
            selection.isFocusEnd = true;
        } else {
            selection.collapse(true);
            selection.setStartOffset([index, offset]);
            selection.isFocusEnd = false;
        }
    }, [])
    const updateSelectionFocusStart = useCallback((startOffset: Offset, selection: Selection) => {
        const [index, offset] = startOffset;
        if (index < selection.endOffset[0] || (index === selection.endOffset[0] && offset < selection.endOffset[1])) {
            selection.setStartOffset([index, offset]);
            selection.isFocusEnd = false;
        } else if (selection.endOffset[0] === index && selection.endOffset[1] === offset) {
            selection.collapse(false);
            selection.isFocusEnd = false;
        } else {
            selection.collapse(false);
            selection.setEndOffset([index, offset]);
            selection.isFocusEnd = true;
        }
    }, []);

    const updateSelectionPosition = useCallback((selection: Selection) => {
        const editorContainer = document.getElementById('editor-container') as HTMLDivElement;
        const rect2 = editorContainer.getBoundingClientRect();
        const x2 = rect2.x
        const y2 = rect2.y

        if (selection.isCollapsed) {
            // 단일 영역
            const offset = selection.startOffset;
            const range = getRangeByOffset(...offset);
            const rect = getRectByRange(range)
            const x = rect.x
            const y = rect.y
            const height = Math.round(rect.height);

            const absoluteX = x - x2
            const absoluteY = y - y2

            setSelectionPosition({
                startRect: {
                    left: absoluteX,
                    top: absoluteY,
                    height: height,
                },
                endRect: {
                    left: absoluteX,
                    top: absoluteY,
                    height: height,
                },
                isCollapsed: true,
            })
        } else {
            const startOffset = selection.startOffset
            const endOffset = selection.endOffset

            const startRange = getRangeByOffset(...startOffset);
            const endRange = getRangeByOffset(...endOffset);

            const startRect = getRectByRange(startRange)
            const endRect = getRectByRange(endRange)

            setSelectionPosition({
                startRect: {
                    left: startRect.left - x2,
                    top: startRect.top - y2,
                    height: startRect.height
                },
                endRect: {
                    left: endRect.left - x2,
                    top: endRect.top - y2,
                    height: endRect.height},
                isCollapsed: false,
            })
        }
    }, [])

    useLayoutEffect(() => {
        updateSelectionPosition(internalState.current.selection)
    }, [contents, resizeState, focusRange])


    // 이벤트 처리
    useEffect(() => {
        const type = eventState.type;
        switch (type) {
            case 'keyDown': {
                if ('keyDown' in eventState) {
                    // Safari 는 알아서 잘 처리하는데, chrome 은 키다운 -> IME 완료 -> 키다운, 이렇게 하기에 그걸 방지하기 위한
                    const IME = internalState.current.IME
                    if (IME.IMEState) {
                        // IME 중에는 IME 백스페이스 기본 동작 실행
                        break;
                    }

                    const e = eventState.keyDown
                    switch (e.code) {
                        case 'ArrowUp': {
                            const selection = internalState.current.selection;

                            if (e.metaKey && e.shiftKey) {
                                // Shift + Meta key 동시 눌림
                                if (selection.isFocusEnd) {
                                    updateSelectionFocusEnd([0, 0], selection)
                                } else {
                                    updateSelectionFocusStart([0, 0], selection)
                                }

                            }

                            if (e.metaKey && !e.shiftKey) {
                                // Meta key 만 눌림
                                selection.setStartOffset([0, 0])
                                selection.collapse(true)
                            }

                            if (e.shiftKey && !e.metaKey) {
                                // Shift key 만 눌림
                                const startOffset = selection.startOffset;
                                const endOffset = selection.endOffset;
                                const verticalCaret = internalState.current.verticalCaret;
                                if (selection.isFocusEnd) {
                                    updateSelectionFocusEnd(getCaretUpOffset(
                                        endOffset[0],
                                        endOffset[1],
                                        contents.content,
                                        verticalCaret) ?? endOffset,
                                        selection
                                    )
                                } else {
                                    updateSelectionFocusStart(getCaretUpOffset(
                                        startOffset[0],
                                        startOffset[1],
                                        contents.content,
                                        verticalCaret) ?? startOffset,
                                        selection
                                    )
                                }
                            }

                            if (!e.metaKey && !e.shiftKey) {
                                // 둘 다 안 눌림
                                const [index, offset] = selection.startOffset;
                                const verticalCaret = internalState.current.verticalCaret;
                                const newOffset = getCaretUpOffset(
                                    index,
                                    offset,
                                    contents.content,
                                    verticalCaret
                                );

                                if (newOffset) {
                                    selection.setStartOffset(newOffset);
                                    selection.collapse(true)
                                }
                            }

                            break
                        }
                        case 'ArrowDown': {
                            const selection = internalState.current.selection;

                            if (e.metaKey && e.shiftKey) {
                                // Shift + Meta key 동시 눌림
                                const content = contents.content;
                                if (selection.isFocusEnd) {
                                    updateSelectionFocusEnd([content.length - 1, content[content.length - 1].text.length], selection)
                                } else {
                                    updateSelectionFocusStart([content.length - 1, content[content.length - 1].text.length], selection)
                                }
                            }

                            if (e.metaKey && !e.shiftKey) {
                                // Meta key 만 눌림
                                const content = contents.content;
                                selection.setStartOffset([content.length - 1, content[content.length - 1].text.length]);
                                selection.collapse(true)
                            }

                            if (e.shiftKey && !e.metaKey) {
                                // Shift key 만 눌림
                                const startOffset = selection.startOffset;
                                const endOffset = selection.endOffset;
                                const verticalCaret = internalState.current.verticalCaret;
                                if (selection.isFocusEnd) {
                                    updateSelectionFocusEnd(getCaretDownOffset(
                                        endOffset[0],
                                        endOffset[1],
                                        contents.content,
                                        verticalCaret) ?? endOffset,
                                        selection
                                    )
                                } else {
                                    updateSelectionFocusStart(getCaretDownOffset(
                                        startOffset[0],
                                        startOffset[1],
                                        contents.content,
                                        verticalCaret) ?? startOffset,
                                        selection
                                    )
                                }
                            }

                            if (!e.metaKey && !e.shiftKey) {
                                // 둘 다 안 눌림
                                const [index, offset] = selection.endOffset;
                                const verticalCaret = internalState.current.verticalCaret;
                                const newOffset = getCaretDownOffset(
                                    index,
                                    offset,
                                    contents.content,
                                    verticalCaret
                                ) ?? [index, offset];

                                if (newOffset) {
                                    selection.setStartOffset(newOffset);
                                    selection.collapse(true)
                                }
                            }

                            break
                        }
                        case 'ArrowLeft': {
                            const selection = internalState.current.selection;

                            if (e.metaKey && e.shiftKey) {
                                // Shift + Meta key 동시 눌림
                                const startOffset = selection.startOffset;
                                const endOffset = selection.endOffset;
                                if (selection.isFocusEnd) {
                                    updateSelectionFocusEnd(getCaretLeftEndOffset(endOffset[0], endOffset[1], contents.content) ?? endOffset, selection)
                                } else {
                                    updateSelectionFocusStart(getCaretLeftEndOffset(startOffset[0], startOffset[1], contents.content) ?? startOffset, selection)
                                }

                            }

                            if (e.metaKey && !e.shiftKey) {
                                // Meta key 만 눌림
                                const [index, offset] = selection.startOffset;
                                selection.setStartOffset(getCaretLeftEndOffset(index, offset, contents.content) ?? [index, offset]);
                                selection.collapse(true)
                            }

                            if (e.shiftKey && !e.metaKey) {
                                // Shift key 만 눌림
                                const startOffset = selection.startOffset;
                                const endOffset = selection.endOffset;
                                if (selection.isFocusEnd) {
                                    updateSelectionFocusEnd(getCaretLeftOffset(endOffset[0], endOffset[1], contents.content), selection)
                                } else {
                                    updateSelectionFocusStart(getCaretLeftOffset(startOffset[0], startOffset[1], contents.content), selection)
                                }

                            }

                            if (!e.metaKey && !e.shiftKey) {
                                // 둘 다 안 눌림
                                const [index, offset] = selection.startOffset;
                                const newOffset = getCaretLeftOffset(
                                    index,
                                    offset,
                                    contents.content
                                );

                                if (newOffset) {
                                    selection.setStartOffset(newOffset);
                                    selection.collapse(true)
                                }
                            }
                            break
                        }
                        case 'ArrowRight': {
                            const selection = internalState.current.selection;

                            if (e.metaKey && e.shiftKey) {
                                // Shift + Meta key 동시 눌림
                                const startOffset = selection.startOffset;
                                const endOffset = selection.endOffset;
                                if (selection.isFocusEnd) {
                                    updateSelectionFocusEnd(getCaretRightEndOffset(endOffset[0], endOffset[1], contents.content) ?? endOffset, selection)
                                } else {
                                    updateSelectionFocusStart(getCaretRightEndOffset(startOffset[0], startOffset[1], contents.content) ?? startOffset, selection)
                                }

                            }

                            if (e.metaKey && !e.shiftKey) {
                                // Meta key 만 눌림
                                const [index, offset] = selection.endOffset;
                                selection.setStartOffset(getCaretRightEndOffset(index, offset, contents.content) ?? [index, offset]);
                                selection.collapse(true)
                            }

                            if (e.shiftKey && !e.metaKey) {
                                // Shift key 만 눌림
                                const startOffset = selection.startOffset;
                                const endOffset = selection.endOffset;
                                if (selection.isFocusEnd) {
                                    updateSelectionFocusEnd(getCaretRightOffset(endOffset[0], endOffset[1], contents.content), selection)
                                } else {
                                    updateSelectionFocusStart(getCaretRightOffset(startOffset[0], startOffset[1], contents.content), selection)
                                }

                            }

                            if (!e.metaKey && !e.shiftKey) {
                                // 둘 다 안 눌림
                                const [index, offset] = selection.endOffset;
                                const newOffset = getCaretRightOffset(
                                    index,
                                    offset,
                                    contents.content
                                );

                                if (newOffset) {
                                    selection.setStartOffset(newOffset);
                                    selection.collapse(true)
                                }
                            }
                            break
                        }
                        case 'Backspace': {

                            const selection = internalState.current.selection;
                            const content = contents.content;

                            if (selection.isCollapsed) {
                                const startOffset = selection.startOffset;
                                if (0 < startOffset[1]) {
                                    // 문단 내
                                    const [index, offset] = startOffset;
                                    const newContent = [...content];
                                    const text = content[index].text;
                                    newContent[index] = { ...content[index], text: text.slice(0, offset - 1) + text.slice(offset) };
                                    setContents({
                                        content: newContent,
                                        maxIndex: contents.maxIndex
                                    })
                                    selection.setStartOffset([index, offset - 1])
                                    selection.collapse(true)
                                } else if (0 < startOffset[0]) {
                                    // 문단 합치기
                                    const [index, offset] = startOffset;
                                    const newContent = [...content];
                                    newContent.splice(index - 1, 2, {
                                        key: content[index - 1].key,
                                        text: content[index - 1].text + content[index].text
                                    })
                                    selection.setStartOffset([index - 1, content[index - 1].text.length]);
                                    selection.collapse(true)
                                    setContents({
                                        content: newContent,
                                        maxIndex: contents.maxIndex
                                    })
                                } else {
                                    // 0, 0 offset 이면
                                }
                            } else {
                                // selection 영역 삭제
                                const startOffset = selection.startOffset;
                                const endOffset = selection.endOffset;
                                const text1 = content[startOffset[0]].text.slice(0, startOffset[1])
                                const text2 = content[endOffset[0]].text.slice(endOffset[1])
                                const line = {
                                    key: content[startOffset[0]].key,
                                    text: text1 + text2
                                }
                                const newContent = [...content]
                                newContent.splice(startOffset[0], endOffset[0] - startOffset[0] + 1, line)
                                setContents({
                                    content: newContent,
                                    maxIndex: contents.maxIndex
                                })
                                selection.setStartOffset([startOffset[0], startOffset[1]])
                                selection.collapse(true)
                            }
                            break
                        }
                        case 'Enter': {
                            const selection = internalState.current.selection;
                            const content = contents.content;
                            if (selection.isCollapsed) {
                                const [index, offset] = selection.startOffset;
                                const newContent = [...content];

                                const line1 = {
                                    text: content[index].text.slice(0, offset),
                                    key: content[index].key,
                                }
                                const line2 = {
                                    text: content[index].text.slice(offset),
                                    key: contents.maxIndex
                                }
                                newContent.splice(index, 1, line1, line2)
                                setContents({
                                    content: newContent,
                                    maxIndex: contents.maxIndex + 1
                                })
                                selection.setStartOffset([index + 1, 0])
                                selection.collapse(true)
                            } else {

                            }
                            break
                        }
                    }
                    // 방향키 업/다운 제외 공통 동작을 여기에 추가
                    if (!(['ArrowUp', 'ArrowDown'].includes(e.code))) {
                        internalState.current.verticalCaret.isCached = false;
                    }

                    // caret 이동에 따른 동작
                    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
                        // 포지션 변경
                        updateSelectionPosition(internalState.current.selection)
                        updateFocusRange(internalState.current.selection)
                    }

                    // 내용 추가 삭제에 따른 caret 동작
                    if (['Enter', 'Backspace'].includes(e.code)) {
                        // 포커스만 변경, selectionPosition 은 content 변경에 따른 useLayoutEffect 에서 처리
                        updateFocusRange(internalState.current.selection)
                    }
                }

                break
            }
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
            case 'blur': {
                setFocusState(false)
                break
            }
        }
    }, [eventState])



    return (
        <div
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

                setFocusState(true)
                updateSelectionPosition(selection)
                updateFocusRange(selection)
                internalState.current.verticalCaret.isCached = false;
                // 포커스 이동
                const input = document.getElementById('input');
                input?.focus()
                e.preventDefault()
            }}
            onMouseMove={e => {
                // 마우스 드래그
                if (e.buttons === 1) {
                    // 왼쪽 버튼 누름
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
                        if (selection.isFocusEnd) {
                            updateSelectionFocusEnd([index, offset], selection)
                        } else {
                            updateSelectionFocusStart([index, offset], selection)
                        }
                    } else {
                        // Neither method is supported, do nothing
                        return;
                    }
                    updateSelectionPosition(selection)
                    updateFocusRange(selection)
                }
                e.preventDefault()
            }}
            onMouseUp={e => {

                e.preventDefault()
                const input = document.getElementById('input')
                input?.focus()

            }}
            ref={resizeRef}
            className={styles.editorContainer}
            id={'editor-container'}>
            <TextSelectionMemo selectionPosition={focusState ? selectionPosition : null}/>
            <div
                className={styles.editor}
                id={'editor'}
            >
                <ParserComponent content={contents.content} focus={focusState ? focusRange : [-1, -1]} />
            </div>
            <InputMemo setEventState={setEventState} position={selectionPosition.startRect}/>
        </div>
    )
}


const getOffsetByRange = (range: Range): Offset => {
    const node = range.startContainer
    if (node.nodeType === Node.TEXT_NODE) {
        // 텍스트 노드가 잡히면
        const textNode = node as Text;
        const spanNode = textNode.parentNode as Node;
        const blockNode = spanNode.parentNode as Node;
        const editor = blockNode.parentNode as Node;

        const index = Array.prototype.indexOf.call(editor.childNodes, blockNode);
        const cloneRange = range.cloneRange();
        cloneRange.setStart(blockNode, 0);
        const offset = cloneRange.toString().length;
        return [index, offset]
    } else {
        // 텍스트 노드가 안잡히면 -> 근처에 빈줄 <br/> 이 있는 경우
        const spanNode = node as Node;
        const blockNode = spanNode.parentNode as Node;
        const editor = blockNode.parentNode as Node;

        const index = Array.prototype.indexOf.call(editor.childNodes, blockNode);
        return [index, 0]
    }
}

const getRangeByOffset = (index: number, offset: number) => {
    const editor = document.getElementById("editor") as HTMLDivElement;
    const block = editor.childNodes[index]
    let span = block.firstChild as HTMLSpanElement;
    const node = span.firstChild as Node;
    if (node?.nodeType === Node.TEXT_NODE) {
        // 텍스트노드 존재
        let textNode = node as Text;
        let currentOffset = 0;
        while (currentOffset + textNode.length < offset) {
            currentOffset += textNode.length;
            span = span.nextSibling as HTMLSpanElement;
            textNode = span.firstChild as Text;
        }
        const range = document.createRange();
        range.setStart(textNode, offset - currentOffset);
        range.collapse(true);
        return range
    } else {
        // <br/>
        const range = document.createRange();
        range.setStart(span, 0)
        range.collapse(true);
        return range
    }
}

const getRectByRange = (range: Range): DOMRect => {

    const { startContainer, startOffset } = range;
    // 텍스트 노드의 오프셋일 경우
    if (startContainer.nodeType === Node.TEXT_NODE) {
        const textNode = startContainer as Text;
        const rangeForRect = document.createRange();
        rangeForRect.setStart(textNode, startOffset);
        rangeForRect.collapse(true);
        return rangeForRect.getBoundingClientRect();
    }

    // 빈 문단일 경우 (span 태그 내부에 <br> 태그만 있는 경우)
    if (startContainer.nodeType === Node.ELEMENT_NODE && (startContainer as HTMLElement).tagName === 'SPAN') {
        const spanElement = startContainer as HTMLElement;
        if (spanElement.childNodes.length === 1 && spanElement.firstChild?.nodeType === Node.ELEMENT_NODE && (spanElement.firstChild as HTMLElement).tagName === 'BR') {
            return spanElement.getBoundingClientRect();
        }
    }

    // 기본 처리
    return range.getBoundingClientRect();
};

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

const getCaretDownOffset = (index: number, offset: number, content: Content[], verticalCaret: VerticalCaret): Offset | null => {
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
            verticalCaret.x = startX
        }
        let lineCount = 0;

        let prevIndex = index;
        let prevOffset = offset;

        let changeP = false

        // offset 을 증가시키면서 탐색
        while (true) {
            changeP = false

            if (offset < content[index].text.length) {
                // 문단 내에서 처리
                offset += 1;
            } else if (index < content.length - 1) {
                // 문단 이동
                index += 1;
                offset = 0;
                lineCount += 1;
                changeP = true
            } else {
                // 문서의 마지막으로 도착
                return [content.length - 1, content[content.length - 1].text.length];
            }

            const newRange = getRangeByOffset(index, offset);
            const newRect = getRectByRange(newRange);
            const newX = newRect.x;

            // 줄바꿈 확인
            if (newX < currentX && !changeP) {
                lineCount += 1;
            }

            // 조건 만족
            // 줄바꿈이 한번 된 상태에서 기존 X를 넘을 경우 || 줄바꿈이 2번 된 순간
            if (startX <= newX && lineCount === 1) {
                return [index, offset];
            }
            if (lineCount === 2) {
                return [prevIndex, prevOffset];
            }

            currentX = newX;
            prevIndex = index;
            prevOffset = offset;
        }
    }

    return null;
}

const getCaretLeftOffset = (index: number, offset: number, content: Content[]): Offset => {
    if (0 < offset) {
        return [index, offset - 1]
    } else if (0 < index) {
        return [index - 1, content[index - 1].text.length];
    } else {
        return [0, 0]
    }
}

const getCaretLeftEndOffset = (index: number, offset: number, content: Content[]): Offset | null => {
    const range = getRangeByOffset(index, offset);
    const node = range.startContainer;

    if (node.nodeType === Node.TEXT_NODE || (node.nodeType === Node.ELEMENT_NODE && (node as HTMLElement).tagName === 'SPAN')) {
        const rect = getRectByRange(range);
        let startX = rect.x;

        let currentX = startX;
        let lineCount = 0;

        let prevIndex = index;
        let prevOffset = offset;

        // offset 을 감소시키면서 탐색
        while (true) {

            if (0 < offset) {
                // 문단 내에서 처리
                offset -= 1;
            } else if (0 < index) {
                // 문단 이동
                offset = content[index - 1].text.length;
                index -= 1;
            } else {
                // 문서의 처음으로 도착
                return [0, 0]
            }

            const newRange = getRangeByOffset(index, offset);
            const newRect = getRectByRange(newRange);
            const newX = newRect.x

            // 줄바꿈 확인
            if (currentX <= newX) {
                lineCount += 1;
            }

            // 조건 만족
            if (offset === 0) {
                return [index, offset]
            }
            if (lineCount === 1) {
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

const getCaretRightOffset = (index: number, offset: number, content: Content[]): Offset => {
    if (offset < content[index].text.length) {
        return [index, offset + 1]
    } else if (index < content.length - 1) {
        return [index + 1, 0]
    } else {
        return [content.length - 1, content[content.length - 1].text.length];
    }
}

const getCaretRightEndOffset = (index: number, offset: number, content: Content[]): Offset | null => {
    const range = getRangeByOffset(index, offset);
    const node = range.startContainer;

    if (node.nodeType === Node.TEXT_NODE || (node.nodeType === Node.ELEMENT_NODE && (node as HTMLElement).tagName === 'SPAN')) {
        const rect = getRectByRange(range);
        let startX = rect.x;

        let currentX = startX;
        let lineCount = 0;

        let prevIndex = index;
        let prevOffset = offset;

        // offset 을 증가시키면서 탐색
        while (true) {
            if (offset < content[index].text.length) {
                // 문단 내에서 처리
                offset += 1;
            } else if (index < content.length - 1) {
                // 문단 이동
                index += 1;
                offset = 0;
            } else {
                // 문서의 마지막으로 도착
                return [content.length - 1, content[content.length - 1].text.length];
            }

            const newRange = getRangeByOffset(index, offset);
            const newRect = getRectByRange(newRange);
            const newX = newRect.x;

            // 줄바꿈 확인
            if (newX <= currentX) {
                lineCount += 1;
            }

            // 조건 만족
            // 줄바꿈이 한번 된 상태에서 기존 X를 넘을 경우 || 줄바꿈이 2번 된 순간
            if (offset === content[index].text.length) {
                return [index, offset];
            }
            if (lineCount === 1) {
                return [prevIndex, prevOffset];
            }

            currentX = newX;
            prevIndex = index;
            prevOffset = offset;
        }
    }

    return null;
}


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

const InputMemo = React.memo(Input)

function Caret({position}: { position: Rect}) {
    return (
        <div id={'cursor'}
             style={{
                 zIndex: 7,
                 position: 'absolute',
                 top: position.top,
                 left: position.left,
                 height: position.height,
                 width: '0px',
                 overflow: 'visible',
                 WebkitTransform: 'translateZ(0)',
             }}>
            <div style={{background: 'black', width: '1px', height: '100%'}}/>
        </div>
    )
}

function Selection({startRect, endRect}: {startRect: Rect, endRect: Rect}) {
    if (startRect.top + startRect.height <= endRect.top) {
        return (
            <>
                <div style={{
                    zIndex: 1,
                    position: 'absolute',
                    left: `${startRect.left}px`,
                    right: `0px`,
                    top: `${startRect.top}px`,
                    height: `${startRect.height}px`,
                    backgroundColor: "rgba(187, 214, 251, 255)"
                }}/>
                <div style={{
                    zIndex: 1,
                    position: 'absolute',
                    left: `0px`,
                    right: `0px`,
                    top: `${startRect.top + startRect.height}px`,
                    height: `${endRect.top - startRect.top - startRect.height}px`,
                    backgroundColor: "rgba(187, 214, 251, 255)"
                }}/>
                <div style={{
                    zIndex: 1,
                    position: 'absolute',
                    left: `0px`,
                    width: `${endRect.left}px`,
                    top: `${endRect.top}px`,
                    height: `${endRect.height}px`,
                    backgroundColor: "rgba(187, 214, 251, 255)"
                }}/>
            </>
        )
    } else {
        return (
            <div style={{
                zIndex: 1,
                position: 'absolute',
                left: `${startRect.left}px`,
                width: `${endRect.left - startRect.left}px`,
                top: `${startRect.top}px`,
                height: `${startRect.height}px`,
                backgroundColor: "rgba(187, 214, 251, 255)"
            }}/>
        )
    }
}

function TextSelection({selectionPosition}: {selectionPosition: SelectionPosition | null}) {
    if (!selectionPosition) {
        return null
    }

    if (selectionPosition.isCollapsed) {
        return <Caret position={selectionPosition.startRect} />
    } else {
        return <Selection startRect={selectionPosition.startRect} endRect={selectionPosition.endRect} />
    }
}

const TextSelectionMemo = React.memo(TextSelection)