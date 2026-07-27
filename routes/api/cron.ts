import { eventHandler } from "h3";

export default eventHandler(() => {
  return {
    success: true,
    timestamp: new Date().toISOString(),
    message: "Cron job executed successfully",
  };
});
