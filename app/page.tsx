import { BackgroundRemover } from "./BackgroundRemover";
import { getAccountUser } from "./account-auth";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await getAccountUser();

  return (
    <BackgroundRemover
      viewer={
        user
          ? { displayName: user.displayName, email: user.email }
          : null
      }
    />
  );
}
