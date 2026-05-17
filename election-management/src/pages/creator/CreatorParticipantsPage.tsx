import '@/styles/creator-participants.css'
import { CreatorParticipantsView } from '@/components/creator/participants/CreatorParticipantsView'
import { useCreatorElection } from '@/context/CreatorElectionContext'

export function CreatorParticipantsPage() {
  const { elections, loading, selectedId, selectedElection, setSelectedId, refreshElections } =
    useCreatorElection()

  return (
    <CreatorParticipantsView
      elections={elections}
      electionsLoading={loading}
      selectedId={selectedId}
      selectedElection={selectedElection}
      onSelectElection={setSelectedId}
      onRefreshElections={refreshElections}
    />
  )
}
