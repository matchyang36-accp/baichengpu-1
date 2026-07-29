import { BackgroundRemover } from "./BackgroundRemover";
import { getChatGPTUser } from "./chatgpt-auth";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await getChatGPTUser();

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
