<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>StockPilot Login</title>
    @vite(['resources/css/app.css'])
</head>
<body>
    <main class="login-page">
        <form class="login-card" method="post" action="/login">
            @csrf
            <img src="/images/logo2.jpeg" alt="StockPilot logo">
            <h1>StockPilot</h1>
            <p>Sign in to manage inventory.</p>

            @if ($errors->any())
                <div class="form-error">{{ $errors->first() }}</div>
            @endif

            <label>Username
                <input type="text" name="username" value="{{ old('username', 'admin') }}" required autofocus autocomplete="username">
            </label>
            <label>Password
                <input type="password" name="password" required autocomplete="current-password">
            </label>
            <label class="check-row">
                <input type="checkbox" name="remember" value="1">
                <span>Remember me</span>
            </label>
            <button type="submit" class="primary-button">Log In</button>
        </form>
    </main>
</body>
</html>
