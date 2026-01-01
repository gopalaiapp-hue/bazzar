import React, { useState } from 'react';
import { Button } from './button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './dialog';
import { Label } from './label';
import { Input } from './input';
import { Textarea } from './textarea';
import { Plus, Gift } from 'lucide-react';

interface CustomRewardDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: (reward: CustomReward) => void;
}

export interface CustomReward {
    id: string;
    name: string;
    description: string;
    pointsRequired: number;
    createdAt: string;
}

export function CustomRewardDialog({ open, onOpenChange, onSave }: CustomRewardDialogProps) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [pointsRequired, setPointsRequired] = useState('');

    const handleSave = () => {
        if (!name || !pointsRequired || parseInt(pointsRequired) <= 0) {
            return;
        }

        const reward: CustomReward = {
            id: `custom_${Date.now()}`,
            name,
            description,
            pointsRequired: parseInt(pointsRequired),
            createdAt: new Date().toISOString()
        };

        onSave(reward);

        // Reset form
        setName('');
        setDescription('');
        setPointsRequired('');
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Gift className="w-5 h-5 text-pink-500" />
                        Add Custom Reward
                    </DialogTitle>
                    <DialogDescription>
                        Create your own personalized reward to work towards together!
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Reward Name */}
                    <div className="space-y-2">
                        <Label htmlFor="reward-name">Reward Name *</Label>
                        <Input
                            id="reward-name"
                            placeholder="e.g., Weekend Getaway, Fancy Dinner"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            maxLength={50}
                        />
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <Label htmlFor="reward-description">Description (Optional)</Label>
                        <Textarea
                            id="reward-description"
                            placeholder="Add details about your reward..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            maxLength={200}
                            rows={3}
                        />
                    </div>

                    {/* Points Required */}
                    <div className="space-y-2">
                        <Label htmlFor="points-required">Points Required *</Label>
                        <Input
                            id="points-required"
                            type="number"
                            placeholder="e.g., 100"
                            value={pointsRequired}
                            onChange={(e) => setPointsRequired(e.target.value)}
                            min="1"
                        />
                        <p className="text-xs text-gray-500">
                            How many FairShare points needed to unlock this reward?
                        </p>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={!name || !pointsRequired || parseInt(pointsRequired) <= 0}
                        className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Reward
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
