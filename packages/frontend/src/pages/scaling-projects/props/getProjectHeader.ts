import { Layer2, ProjectLinks } from '@l2beat/config'
import { ActivityApiResponse, TvlApiResponse } from '@l2beat/shared'

import { Config } from '../../../build/config'
import { formatLargeNumber } from '../../../utils'
import { getTpsDaily } from '../../../utils/activity/getTpsDaily'
import { getTpsWeeklyChange } from '../../../utils/activity/getTpsWeeklyChange'
import { getTransactionCount } from '../../../utils/activity/getTransactionCount'
import { getRiskValues } from '../../../utils/risks/values'
import { getTvlBreakdown } from '../../../utils/tvl/getTVLBreakdown'
import { getTvlWithChange } from '../../../utils/tvl/getTvlWitchChange'
import { formatUSD } from '../../../utils/utils'
import { ProjectHeaderProps } from '../view/ProjectHeader'

export function getProjectHeader(
  project: Layer2,
  config: Config,
  tvlApiResponse: TvlApiResponse,
  activityApiResponse?: ActivityApiResponse,
): ProjectHeaderProps {
  const apiProject = tvlApiResponse.projects[project.id.toString()]
  const charts = apiProject?.charts
  const { tvl, tvlWeeklyChange } = getTvlWithChange(charts)

  const activityData =
    activityApiResponse?.projects[project.id.toString()]?.data
  const tpsDaily = getTpsDaily(activityData)
  const tpsWeeklyChange = getTpsWeeklyChange(activityData)
  const transactionMonthlyCount = getTransactionCount(activityData, 'month')

  const tvlBreakdown = getTvlBreakdown(
    project.display.name,
    project.config.associatedTokens ?? [],
    tvl,
    apiProject?.tokens ?? [],
  )

  return {
    icon: `/icons/${project.display.slug}.png`,
    title: project.display.name,
    titleLength: getTitleLength(project.display.name),
    tvl: formatUSD(tvl),
    tvlWeeklyChange,
    tpsDaily: tpsDaily?.toFixed(2) ?? '',
    tpsWeeklyChange,
    transactionMonthlyCount:
      transactionMonthlyCount !== undefined
        ? formatLargeNumber(transactionMonthlyCount)
        : undefined,
    purpose: project.display.purpose,
    technology: project.technology.category,
    tvlBreakdown,
    links: getLinks(project.display.links),
    maturityEntry: config.features.maturity && project.maturity,
    // TODO: will need to be riskValues when rosette has hover
    risks: getRiskValues(project.riskView),
    isArchived: project.isArchived,
    isUpcoming: project.isUpcoming,
  }
}

function getTitleLength(name: string): 'long' | 'very-long' | undefined {
  switch (name) {
    case 'Optimism':
    case 'rhino.fi':
    case 'Immutable X':
      return 'long'
    case 'OMG Network':
    case 'Layer2.Finance':
    case 'ZKSwap V2':
    case 'Polygon Hermez':
    case 'Metis Andromeda':
      return 'very-long'
  }
}

function getLinks(links: ProjectLinks) {
  const items = [
    {
      name: 'Website',
      links: links.websites,
    },
    {
      name: 'App',
      links: links.apps,
    },
    {
      name: 'Documentation',
      links: links.documentation,
    },
    {
      name: 'Explorer',
      links: links.explorers,
    },
    {
      name: 'Repository',
      links: links.repositories,
    },
    {
      name: 'Social',
      links: links.socialMedia,
      social: true,
    },
  ]

  return items.filter((link) => link.links.length > 0)
}
