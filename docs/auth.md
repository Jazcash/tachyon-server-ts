# Registration and Login Flow

## Basic

### Register

```mermaid
flowchart LR
    1((Start)) --> 2[/Enter Username, Password,\nEmail, Display Name/]
    2 --> 3{Error}
    3 -- Yes --> 2
    3 -- No --> 5[Create User,\nSend Verification Email]
    5 --> 6[/User Clicks\nLink/]
    6 --> 7[User Verified,\nAutomatic Login]
```

### Login

```mermaid
flowchart LR
    1((Start)) --> 2[Enter Username/Email, Password]
    2 --> 3{Error}
    3 -- Yes --> 2
    3 -- No --> 4[Logged In]
```

## Google

https://developers.google.com/identity/protocols/oauth2

### Register

```mermaid
flowchart LR
    1((Start)) --> 2[Google OAuth]
    2 -- OAuth Callback --> 3[Save Auth Data in Session,\nRequest Additional User Info]
    3 --> 4[/Enter Username,\nDisplay Name/]
    4 --> 5[Create\nUser]
```

### Login

```mermaid
flowchart LR
    1((Start)) --> 2[Google OAuth]
    2 -- OAuth Callback --> 3[Logged In]
```

## Steam

https://partner.steamgames.com/doc/features/auth

### Register

```mermaid
flowchart LR
    1((Start)) --> 2[User Generates Steam\nAuth Session Ticket]
    2 --> 3[Validate Ticket]
    3 --> 4[Save Auth Data in Session,\nRequest Additional User Info]
    4 --> 5[/Enter Username,\nDisplay Name/]
    5 --> 6[Create\nUser]
```

### Login

```mermaid
flowchart LR
    1((Start)) --> 2[User Generates Steam\nAuth Session Ticket]
    2 --> 3[Validate Ticket]
    3 --> 4[Logged In]
```