import { Layout } from '@app/components/layout'
import EditRegistryCard from '@app/components/registries/edit-registry-card'
import RegistryCard from '@app/components/registries/registry-card'
import { BreadcrumbLink } from '@app/components/shared/breadcrumb'
import PageHeading from '@app/components/shared/page-heading'
import { DetailsPageMenu } from '@app/components/shared/page-menu'
import { defaultApiErrorHandler } from '@app/errors'
import { RegistryDetails, registryDetailsToRegistry } from '@app/models'
import { registryApiUrl, registryUrl, ROUTE_REGISTRIES } from '@app/routes'
import { toastWarning, withContextAuthorization } from '@app/utils'
import { cruxFromContext } from '@server/crux/crux'
import { NextPageContext } from 'next'
import useTranslation from 'next-translate/useTranslation'
import { useRouter } from 'next/dist/client/router'
import { useRef, useState } from 'react'

interface RegistryDetailsPageProps {
  registry: RegistryDetails
}

const RegistryDetailsPage = (props: RegistryDetailsPageProps) => {
  const { registry: propsRegistry } = props

  const { t } = useTranslation('registries')

  const router = useRouter()

  const [registry, setRegistry] = useState(propsRegistry)
  const [editing, setEditing] = useState(false)
  const submitRef = useRef<() => Promise<any>>()

  const handleApiError = defaultApiErrorHandler(t)

  const onRegistryEdited = reg => {
    setEditing(false)
    setRegistry(reg)
  }

  const onDelete = async () => {
    const res = await fetch(registryApiUrl(registry.id), {
      method: 'DELETE',
    })

    if (res.ok) {
      router.back()
    } else if (res.status === 412) {
      toastWarning(t('inUse'))
    } else {
      handleApiError(res)
    }
  }

  const pageLink: BreadcrumbLink = {
    name: t('common:registries'),
    url: ROUTE_REGISTRIES,
  }

  return (
    <Layout title={t('registriesName', registry)}>
      <PageHeading
        pageLink={pageLink}
        sublinks={[
          {
            name: registry.name,
            url: registryUrl(registry.id),
          },
        ]}
      >
        <DetailsPageMenu
          onDelete={onDelete}
          editing={editing}
          setEditing={setEditing}
          submitRef={submitRef}
          deleteModalTitle={t('common:confirmDelete', { name: registry.name })}
          deleteModalDescription={t('common:deleteDescription', {
            name: registry.name,
          })}
        />
      </PageHeading>

      {!editing ? (
        <RegistryCard registry={registryDetailsToRegistry(registry)} />
      ) : (
        <EditRegistryCard
          className="p-8"
          registry={registry}
          onRegistryEdited={onRegistryEdited}
          submitRef={submitRef}
        />
      )}
    </Layout>
  )
}

export default RegistryDetailsPage

const getPageServerSideProps = async (context: NextPageContext) => {
  const registryId = context.query.registryId as string

  return {
    props: {
      registry: await cruxFromContext(context).registries.getRegistryDetails(registryId),
    },
  }
}

export const getServerSideProps = withContextAuthorization(getPageServerSideProps)
