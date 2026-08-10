import { redirect } from "next/navigation";

/** Legacy URL — planners portal is now the client experience page */
export default function PlannersRedirectPage() {
  redirect("/clients");
}
