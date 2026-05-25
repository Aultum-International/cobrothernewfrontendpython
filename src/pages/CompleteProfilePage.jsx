import ProfileCompletionModal from '../components/profile/ProfileCompletionModal';

export default function CompleteProfilePage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-8 relative overflow-hidden bg-gradient-to-b from-gray-50 to-indigo-50">
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute w-[500px] h-[500px] bg-purple/16 rounded-full blur-[80px] opacity-70 -top-[150px] -right-[100px]" />
        <div className="absolute w-[400px] h-[400px] bg-blue-500/12 rounded-full blur-[80px] opacity-70 -bottom-[100px] -left-[100px]" />
        <div className="absolute inset-0 opacity-65" style={{backgroundImage: 'linear-gradient(rgba(148,163,184,0.14) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.14) 1px, transparent 1px)', backgroundSize: '60px 60px'}} />
      </div>
      <ProfileCompletionModal forceOpen />
    </div>
  );
}
