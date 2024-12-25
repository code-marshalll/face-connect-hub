import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');

  const ProfileTab = () => (
    <div className="space-y-4">
      <div className="text-center">
        <div className="w-32 h-32 mx-auto rounded-full overflow-hidden bg-gray-200">
          {user?.photoUrl && (
            <img
              src={user.photoUrl}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          )}
        </div>
        <h2 className="mt-4 text-xl font-semibold">{user?.name}</h2>
        <p className="text-gray-600">{user?.email}</p>
      </div>
    </div>
  );

  const ScanTab = () => {
    const [isScanning, setIsScanning] = useState(false);
    const [scannedPerson, setScannedPerson] = useState(null);

    const handleScan = () => {
      setIsScanning(true);
      // TODO: Implement scanning logic
      setTimeout(() => {
        setIsScanning(false);
      }, 2000);
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