import { Layer2 } from '@l2beat/config'

import { formatDate } from '../../../utils'
import { NewsSectionProps } from '../view/NewsSection'

export function getNewsSection(project: Layer2): NewsSectionProps {
  const news = project.details.news.map((x) => ({
    title: x.name,
    href: x.link,
    date: formatDate(x.date),
    domain: new URL(x.link).host,
  }))
  return { news }
}
