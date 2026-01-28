import { getDefaultUserId } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { SettingsForm } from "./settings-form";

async function getUserSettings(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });
  return user;
}

export default async function SettingsPage() {
  const userId = await getDefaultUserId();
  const user = await getUserSettings(userId);

  if (!user) {
    return <div>Fout bij laden van instellingen</div>;
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Instellingen</h1>
        <p className="text-muted-foreground">
          Beheer je bedrijfsgegevens en voorkeuren
        </p>
      </div>

      <SettingsForm user={user} />
    </div>
  );
}
