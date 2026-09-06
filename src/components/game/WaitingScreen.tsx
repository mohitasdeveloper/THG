export default function WaitingScreen({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-6">
      <div className="text-4xl mb-4">⏳</div>
      <p className="text-text-secondary">{message}</p>
    </div>
  );
}
