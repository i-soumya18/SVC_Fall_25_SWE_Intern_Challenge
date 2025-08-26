import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import { MagicLinkAuth } from './MagicLinkAuth'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle
} from '@/components/ui/dialog'
import { User, LogOut, Loader2 } from 'lucide-react'

export function UserMenu() {
  const { user, loading, signOut } = useAuth()
  const [authDialogOpen, setAuthDialogOpen] = useState(false)
  const [signingOut, setSigningOut] = useState(false)

  const handleSignOut = async () => {
    setSigningOut(true)
    try {
      await signOut()
    } catch (error) {
      console.error('Sign out error:', error)
    } finally {
      setSigningOut(false)
    }
  }

  if (loading) {
    return (
      <Button variant="ghost" size="sm" disabled>
        <Loader2 className="h-4 w-4 animate-spin" />
      </Button>
    )
  }

  if (!user) {
    return (
      <Dialog open={authDialogOpen} onOpenChange={setAuthDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            Sign In
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogTitle className="sr-only">Sign In</DialogTitle>
          <MagicLinkAuth onClose={() => setAuthDialogOpen(false)} />
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="flex items-center gap-2">
          <User className="h-4 w-4" />
          <span className="hidden sm:inline-block">
            {user.email?.split('@')[0] || 'Account'}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="px-2 py-1.5 text-sm">
          <div className="font-medium">{user.email?.split('@')[0] || 'User'}</div>
          <div className="text-xs text-gray-500">{user.email}</div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={handleSignOut}
          disabled={signingOut}
          className="text-red-600 focus:text-red-600"
        >
          {signingOut ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Signing out...
            </>
          ) : (
            <>
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </>
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
