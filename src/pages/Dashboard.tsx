import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

interface MatchedPerson {
  user_id: number;
  full_name: string;
  additional_info: string;
}

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [isScanning, setIsScanning] = useState(false);
  const [scannedPerson, setScannedPerson] = useState<MatchedPerson | null>(null);

  const ProfileTab = () => (
    <div className="space-y-4">
      <div className="text-center">
        <div className="w-32 h-32 mx-auto rounded-full overflow-hidden bg-gray-200">
          {/* Profile photo will be fetched separately through the profile endpoint */}
          <img
            src={`http://localhost:8000/profile/photo/${user?.id}`}
            alt="Profile"
            className="w-full h-full object-cover"
          />
        </div>
        <h2 className="mt-4 text-xl font-semibold">{user?.email}</h2>
      </div>
    </div>
  );

  const ScanTab = () => {
    const handleScan = async () => {
      try {
        setIsScanning(true);
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        const video = document.createElement('video');
        video.srcObject = stream;
        await video.play();

        // Capture frame from video
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d')?.drawImage(video, 0, 0);

        // Convert to blob
        const blob = await new Promise<Blob>((resolve) => 
          canvas.toBlob((blob) => resolve(blob!), 'image/jpeg')
        );

        // Stop video stream
        stream.getTracks().forEach(track => track.stop());

        // Send to backend
        const formData = new FormData();
        formData.append('photo', blob, 'scan.jpg');

        const response = await fetch('http://localhost:8000/scan/face', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('No match found');
        }

        const matchedPerson = await response.json();
        setScannedPerson(matchedPerson);
        toast.success('Person found!');
      } catch (error) {
        toast.error('No matching person found');
        setScannedPerson(null);
      } finally {
        setIsScanning(false);
      }
    };

    return (
      <div className="space-y-4">
        <div className="text-center">
          <Button
            onClick={handleScan}
            disabled={isScanning}
            className="w-full max-w-sm"
          >
            {isScanning ? 'Scanning...' : 'Start Scan'}
          </Button>
        </div>
        {scannedPerson && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold">Match Found:</h3>
            <p>Name: {scannedPerson.full_name}</p>
            <p>Additional Info: {scannedPerson.additional_info}</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-end mb-4">
          <Button variant="outline" onClick={logout}>
            Logout
          </Button>
        </div>
        <Card>
          <CardContent className="p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="scan">Scan</TabsTrigger>
              </TabsList>
              <TabsContent value="profile">
                <ProfileTab />
              </TabsContent>
              <TabsContent value="scan">
                <ScanTab />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;