import StoryForm from '../StoryForm'

export default async function EditStoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <StoryForm mode="edit" storyId={id} />
}
