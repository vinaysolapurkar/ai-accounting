"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

interface NewAccountDialogProps {
  userId: string;
  onCreated: () => void;
  trigger?: React.ReactNode;
}

export function NewAccountDialog({ userId, onCreated, trigger }: NewAccountDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [type, setType] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !code || !type) { toast.error("Fill all fields"); return; }

    setSubmitting(true);
    try {
      const res = await fetch("/api/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-id": userId },
        body: JSON.stringify({ name, code, type }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create account");
      }
      toast.success("Account created!");
      setOpen(false);
      setName("");
      setCode("");
      setType("");
      onCreated();
    } catch (err: any) {
      toast.error(err.message || "Failed to create account");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <span onClick={() => setOpen(true)} className="cursor-pointer">
        {trigger || (
          <Button type="button" variant="outline" size="sm">
            <Plus className="w-4 h-4 mr-1" /> New Account
          </Button>
        )}
      </span>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>New Account</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Account Code</Label>
              <Input placeholder="e.g., 1050" value={code} onChange={(e) => setCode(e.target.value)} required />
            </div>
            <div>
              <Label>Account Name</Label>
              <Input placeholder="e.g., Petty Cash" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div>
              <Label>Account Type</Label>
              <Select value={type} onValueChange={(v) => setType(v || "")}>
                <SelectTrigger><SelectValue placeholder="Select type..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="asset">Asset</SelectItem>
                  <SelectItem value="liability">Liability</SelectItem>
                  <SelectItem value="equity">Equity</SelectItem>
                  <SelectItem value="revenue">Revenue</SelectItem>
                  <SelectItem value="expense">Expense</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Create Account
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
