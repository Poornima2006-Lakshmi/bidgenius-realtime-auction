import React, { useState } from 'react';
import { useGetUsers, useAssignCredits } from '@workspace/api-client-react';
import { Search, Coins, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

export default function AdminUsers() {
  const { data: users, isLoading } = useGetUsers();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [search, setSearch] = useState('');
  const [creditInput, setCreditInput] = useState<Record<number, string>>({});

  const assignMutation = useAssignCredits({
    mutation: {
      onSuccess: () => {
        toast({ title: 'Credits added successfully', className: 'bg-success text-success-foreground' });
        queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      },
      onError: (err) => {
        toast({ title: 'Error', description: err.error, variant: 'destructive' });
      }
    }
  });

  const handleAddCredits = (userId: number) => {
    const amount = Number(creditInput[userId]);
    if (!amount || amount <= 0) return;
    
    assignMutation.mutate({
      id: userId,
      data: { amount, action: 'add' }
    });
    
    setCreditInput(prev => ({ ...prev, [userId]: '' }));
  };

  const filtered = users?.filter(u => 
    u.role === 'bidder' && // only show bidders usually for credit management
    (u.name.toLowerCase().includes(search.toLowerCase()) || 
     u.email.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-display tracking-tight mb-2">User Management</h1>
        <p className="text-white/50">Manage registered bidders and allocate platform bidding credits.</p>
      </div>

      <div className="glass-panel rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-white/10 bg-white/5">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input 
              type="text" 
              placeholder="Search users..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-background border border-white/10 rounded-lg py-2 pl-9 pr-4 text-sm text-white focus:outline-none focus:border-primary/50 transition-colors"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 text-white/40 text-xs uppercase tracking-wider font-semibold">
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4 text-right">Available Credits</th>
                <th className="px-6 py-4 text-right">Reserved Credits</th>
                <th className="px-6 py-4">Add Credits</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {isLoading ? (
                <tr><td colSpan={4} className="p-8 text-center text-white/40">Loading users...</td></tr>
              ) : filtered?.map(user => (
                <tr key={user.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-white">{user.name}</div>
                    <div className="text-xs text-white/50">{user.email}</div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="font-mono font-bold text-lg text-primary">
                      ${new Intl.NumberFormat('en-US').format(user.availableCredits)}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right text-white/50 font-mono">
                    ${new Intl.NumberFormat('en-US').format(user.reservedCredits)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 w-48">
                      <div className="relative flex-1">
                        <Coins className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                        <input 
                          type="number"
                          min={1}
                          placeholder="Amount"
                          value={creditInput[user.id] || ''}
                          onChange={e => setCreditInput(prev => ({ ...prev, [user.id]: e.target.value }))}
                          className="w-full bg-background border border-white/10 rounded-lg py-1.5 pl-8 pr-3 text-sm text-white font-mono focus:border-primary/50"
                        />
                      </div>
                      <button 
                        onClick={() => handleAddCredits(user.id)}
                        disabled={!creditInput[user.id] || assignMutation.isPending}
                        className="p-1.5 bg-primary/20 text-primary rounded-lg hover:bg-primary hover:text-white transition-colors disabled:opacity-50"
                      >
                        <Plus size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
