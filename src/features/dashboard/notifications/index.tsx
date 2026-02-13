export const NotificationsPage = () => {
  return (
    <section>
      <div className="bg-muted/60 mb-8 rounded-lg px-4 py-6 sm:px-6 sm:py-8">
        <h1 className="text-foreground text-2xl font-semibold tracking-tight md:text-3xl">
          Notifications
        </h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Manage your notification preferences and alerts.
        </p>
      </div>

      <div className="from-muted/60 to-background rounded-lg bg-linear-to-b px-4 py-6 sm:px-6 sm:py-8">
        <div className="bg-card rounded-lg border p-6 shadow-sm">
          <p className="text-muted-foreground text-sm">
            Notification settings coming soon.
          </p>
        </div>
      </div>
    </section>
  );
};
