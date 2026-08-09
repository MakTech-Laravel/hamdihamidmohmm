<?php

namespace App\Http\Controllers;

use App\Concerns\ProfileValidationRules;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;

class UserProfileController extends Controller
{
    use ProfileValidationRules;

    public function edit()
    {
        return Inertia::render('Profile/Edit', [
            'user' => Auth::user(),
        ]);
    }

    public function update(Request $request)
    {
        $validated = $request->validate($this->profileRules($request->user()->id));

        $user = Auth::user();

        if ($request->hasFile('avatar')) {
            $avatarPath = $request->file('avatar')->store('avatars', 'public');
            $validated['avatar'] = $avatarPath;
        }

        if ($request->filled('password')) {
            if (Hash::check($request->password, $user->password)) {
                return back()->withErrors([
                    'password' => 'New password cannot be the same as your current password.',
                ])->withInput();
            }
            $validated['password'] = bcrypt($request->password);
        } else {
            unset($validated['password'], $validated['password_confirmation']);
        }

        $user->update($validated);
        $user->refresh();

        return redirect()->route('user-profile.edit')->with('success', 'Profile updated successfully.');
    }
}
