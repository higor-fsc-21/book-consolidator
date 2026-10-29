import { Suspense } from "react"
import { getCurrentUser } from "@/lib/auth"
import { HelpCenter } from "@/views/HelpCenter"
import AppLoading from "../loading"

export default async function HelpPage() {
  const user = await getCurrentUser()

  return (
    <Suspense fallback={<AppLoading />}>
      <HelpCenter
        user={{
          name: user.name,
          email: user.email,
        }}
      />
    </Suspense>
  )
}
