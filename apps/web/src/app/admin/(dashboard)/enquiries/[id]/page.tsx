import { redirect } from 'next/navigation';

/** A direct link to one enquiry opens its panel on the list page. */
export default async function EnquiryLinkPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/admin/enquiries?open=${encodeURIComponent(id)}`);
}
