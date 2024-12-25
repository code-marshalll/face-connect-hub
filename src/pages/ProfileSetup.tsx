import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

const ProfileSetup = () => {
  const [name, setName] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const navigate = useNavigate();

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCapturing(true);
      }
    } catch (error) {
      toast.error('Failed to access camera');
    }
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0);
      const photoUrl = canvas.toDataURL('image/jpeg');
      setPhoto(photoUrl);
      stopCamera();
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      setIsCapturing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!photo || !name) {
      toast.error('Please provide both photo and name');
      return;
    }

    try {
      // TODO: Replace with actual API call
      toast.success('Profile updated successfully');
      navigate('/dashboard');
    } catch (error) {
      toast.error('Failed to update profile');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Complete Your Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium">Profile Photo</label>
                <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
                  {isCapturing ? (
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      className="w-full h-full object-cover"
                    />
                  ) : photo ? (
                    <img
                      src={photo}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : null}
                </div>
                <div className="flex gap-2 mt-2">
                  {!isCapturing && !photo && (
                    <Button type="button" onClick={startCamera}>
                      Start Camera
                    </Button>
                  )}
                  {isCapturing && (
                    <Button type="button" onClick={capturePhoto}>
                      Capture
                    </Button>
                  )}
                  {photo && (
                    <Button type="button" onClick={() => setPhoto(null)}>
                      Retake
                    </Button>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium">Full Name</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            </div>
            <Button type="submit" className="w-full">
              Complete Setup
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfileSetup;