import React from 'react'
import { PageMetaMap } from 'cccMetaGenerator/makePageMetaMap'
import { stripUrlShortLink } from 'cccMetaGenerator/makeUrlMap'
import { CCCEnhancedStore } from 'store/cccImporter'
import {
  PageParagraph,
  PageParagraphElement,
  PageNode,
  TextElement,
  PageFootnotes,
  PageFootnote,
  PageFootnoteRef,
} from 'store/cccTypedefs'
import { Layout } from 'components/Layout/Layout'
import { Box, IconButton } from '@material-ui/core'
import { KeyboardArrowLeft, KeyboardArrowRight } from '@material-ui/icons'
import { makeStyles } from '@material-ui/styles'
import { historyPush } from '../../utils/reactRouterUtils'
import { PageBreadcrumbs } from '../PageBreadcrumbs/PageBreadcrumbs'
import * as H from 'history'
import { AppRouteType } from 'components/App'
import { useScrollToTopOnPathChange } from '../common/hooks/useScrollToTopOnRouteChange'
import classnames from 'classnames'

export const PAGE_TOC_ID_MATCH = 'PAGE_TOC_ID'

interface PageRouteParams {
  [PAGE_TOC_ID_MATCH]: string
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface PageProps extends AppRouteType<PageRouteParams> {}

export const Page: React.FC<PageProps> = props => {
  const { cccStore } = props
  const styles = useStyles()

  const shortUrl = getShortUrl(props)
  const tocId = getPageTocId(cccStore, shortUrl)

  useScrollToTopOnPathChange(tocId)
  if (!tocId) {
    return null
  }

  const pageNode = getPageNode(cccStore, tocId)
  const { paragraphs, footnotes } = pageNode

  return (
    <Layout routeHistory={props.history}>
      <PageBreadcrumbs store={cccStore} currentPageId={tocId} />
      <div>{paragraphs.map(renderParagraph(styles))}</div>
      {renderFootnotes(footnotes)}
      {renderPageControls(styles, tocId, cccStore, props.history)}
    </Layout>
  )
}

const renderParagraph = (styles: Record<string, string>) =>
  function renderParagraph(paragraph: PageParagraph, index: number) {
    const { elements, attrs } = paragraph
    return (
      <p
        key={index}
        className={classnames({ [styles.paragraphIndented]: !!attrs.indent })}
      >
        {elements.map(renderParagraphElement)}
      </p>
    )
  }

const renderParagraphElement = (
  element: PageParagraphElement,
  index: number
) => {
  switch (element.type) {
    case 'spacer':
      return <br key={index} />
    case 'ref':
      return <sup key={index}>{element.number}</sup>
    case 'ref-anchor':
      return (
        <WithElementStyles element={element} key={index}>
          <a href={element.link}>⇒</a>
        </WithElementStyles>
      )
    case 'ref-ccc':
      return element.ref_number + ' '
    case 'text':
      return (
        <WithElementStyles element={element} key={index}>
          {element.text}
        </WithElementStyles>
      )
    default:
      return ''
  }
}

interface WithElementStylesProps {
  element: PageParagraphElement
}
const WithElementStyles: React.FC<WithElementStylesProps> = props => {
  const styles = useStyles()
  const element = props.element as TextElement
  const { attrs = {} } = element

  return (
    <span
      className={classnames(styles.elementTextDefaults, {
        [styles.elementTextBold]: attrs.b,
        [styles.elementTextItalicised]: attrs.i,
      })}
    >
      {props.children}
    </span>
  )
}

const renderPageControls = (
  styles: Record<string, string>,
  tocId: string,
  cccStore: CCCEnhancedStore,
  history: H.History
) => {
  const { pageMetaMap } = cccStore.extraMeta
  const { next, prev } = pageMetaMap[tocId]

  const hasNext = hasUrl(next, pageMetaMap)
  const hasPrev = hasUrl(prev, pageMetaMap)

  return (
    <Box className={styles.pageControls}>
      {hasPrev && (
        <IconButton
          className={`${styles.pageControlButton} ${styles.pageLeftButton}`}
          onClick={() =>
            historyPush(history, `/p/${getUrl(prev, pageMetaMap)}`)
          }
        >
          <KeyboardArrowLeft fontSize='large' />
        </IconButton>
      )}
      {hasNext && (
        <IconButton
          className={`${styles.pageControlButton} ${styles.pageRightButton}`}
          onClick={() =>
            historyPush(history, `/p/${getUrl(next, pageMetaMap)}`)
          }
        >
          <KeyboardArrowRight fontSize='large' />
        </IconButton>
      )}
    </Box>
  )
}

const renderFootnotes = (footnotes: PageFootnotes) => {
  // TODO sort ascending
  const footnoteKeys = Object.keys(footnotes)

  const hasFootnotes = footnoteKeys.length > 0
  if (!hasFootnotes) {
    return null
  }

  return (
    <div>{footnoteKeys.map(key => footnotes[key]).map(renderFootnote)}</div>
  )
}

const renderFootnote = (footnote: PageFootnote) => {
  const { refs, number } = footnote
  return (
    <p>
      {refs.reduce(renderFootnoteRefs, [<span key={-1}>{`${number}. `}</span>])}
    </p>
  )
}

const renderFootnoteRefs = (
  acc: JSX.Element[],
  curr: PageFootnoteRef,
  index: number
) => {
  const shouldAddComma = index > 0
  const renderedRef = <span key={index}>{curr.text}</span>

  if (shouldAddComma) {
    return [...acc, <>,</>, renderedRef]
  }
  return [...acc, renderedRef]
}

const hasUrl = (tocId: string, pageMetaMap: PageMetaMap) => tocId in pageMetaMap
const getUrl = (tocId: string, pageMetaMap: PageMetaMap) =>
  pageMetaMap[tocId].url

const getShortUrl = (props: PageProps): string => {
  const fullUrl = props.match.params[PAGE_TOC_ID_MATCH]
  if (!fullUrl) {
    return ''
  }

  return stripUrlShortLink(fullUrl)
}

const getPageTocId = (cccStore: CCCEnhancedStore, shortUrl: string): string => {
  return cccStore.extraMeta.urlMap[shortUrl] || ''
}
const getPageNode = (cccStore: CCCEnhancedStore, tocId: string): PageNode => {
  return cccStore.store.page_nodes[tocId]
}

const useStyles = makeStyles({
  pageControls: { display: 'flex' },
  pageLeftButton: {},
  pageRightButton: { marginLeft: 'auto' },
  pageControlButton: {
    border: '1px solid gray',
  },
  paragraphIndented: {
    margin: '0 5vh',
  },
  elementTextDefaults: {
    display: 'inline',
  },
  elementTextBold: {
    fontWeight: 'bold',
  },
  elementTextItalicised: {
    fontStyle: 'italic',
  },
})
