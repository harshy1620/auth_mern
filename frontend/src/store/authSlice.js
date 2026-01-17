import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../api/axios";

/* -------------------- LOGIN THUNK -------------------- */
export const loginUser = createAsyncThunk(
  "auth/login",
  async ({ email, password }, thunkAPI) => {
    try {
      const res = await api.post("/auth/login", {
        email,
        password,
      });

      return res.data; // { accessToken, user }
    } catch (err) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.message || "Login failed"
      );
    }
  }
);

/* -------------------- SIGNUP THUNK -------------------- */
export const signupUser = createAsyncThunk(
  "auth/signup",
  async ({ name, email, password }, thunkAPI) => {
    try {
      const res = await api.post("/auth/signup", {
        name,
        email,
        password,
      });

      return res.data; // { accessToken, user }
    } catch (err) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.message || "Signup failed"
      );
    }
  }
);

/* -------------------- LOGOUT THUNK -------------------- */
export const logoutUser = createAsyncThunk(
  "auth/logout",
  async (_, thunkAPI) => {
    try {
      await api.post("/auth/logout");
      return true;
    } catch (err) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.message || "Logout failed"
      );
    }
  }
);

/* -------------------- GOOGLE LOGIN THUNK -------------------- */
export const googleLoginUser = createAsyncThunk(
  "auth/googleLogin",
  async ({ idToken }, thunkAPI) => {
    try {
      const res = await api.post("/auth/google", {
        idToken,
      });

      return res.data; // { accessToken, user }
    } catch (err) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.message || "Google login failed"
      );
    }
  }
);

/* ---------------- FORGOT PASSWORD ---------------- */
export const forgotPassword = createAsyncThunk(
  "auth/forgotPassword",
  async (email, thunkAPI) => {
    try {
      const res = await api.post("/auth/forgot-password", { email });
      return res.data.message;
    } catch (err) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.message || "Failed to send reset email"
      );
    }
  }
);

/* ---------------- RESET PASSWORD ---------------- */
export const resetPassword = createAsyncThunk(
  "auth/resetPassword",
  async ({ token, password }, thunkAPI) => {
    try {
      const res = await api.post(`/auth/reset-password/${token}`, {
        password,
      });
      return res.data.message;
    } catch (err) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.message || "Password reset failed"
      );
    }
  }
);



/* -------------------- INITIAL STATE -------------------- */
const initialState = {
  user: null, // { id, email, role }
  accessToken: null,
  isAuthenticated: false,
  loading: false,
  error: null,
   authChecked: false,
   successMessage: null,
   isLoggedOut: false,
};

/* -------------------- SLICE -------------------- */
const authSlice = createSlice({
  name: "auth",
  initialState,
    reducers: {
    setAuthChecked(state) {
      state.authChecked = true;
    },
     setCredentials(state, action) {
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.isAuthenticated = true;
    },
  },
  extraReducers: (builder) => {
    builder
      /* ---------------- LOGIN ---------------- */

      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
      })

      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      /* ---------------- SIGNUP ---------------- */

      .addCase(signupUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(signupUser.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
      })

      .addCase(signupUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      /* ---------------- LOGOUT ---------------- */

      .addCase(logoutUser.pending, (state) => {
        state.loading = true;
      })

      .addCase(logoutUser.fulfilled, (state) => {
        state.loading = false;
        state.user = null;
        state.accessToken = null;
        state.isAuthenticated = false;
        state.error = null;
        state.isLoggedOut = true;
      })

      .addCase(logoutUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      /* ---------------- GOOGLE LOGIN ---------------- */

.addCase(googleLoginUser.pending, (state) => {
  state.loading = true;
  state.error = null;
})

.addCase(googleLoginUser.fulfilled, (state, action) => {
  state.loading = false;
  state.isAuthenticated = true;
  state.user = action.payload.user;
  state.accessToken = action.payload.accessToken;
})

.addCase(googleLoginUser.rejected, (state, action) => {
  state.loading = false;
  state.error = action.payload;
})

  /* ---------- FORGOT PASSWORD ---------- */
  .addCase(forgotPassword.pending, (state) => {
    state.loading = true;
    state.error = null;
    state.successMessage = null;
  })
  .addCase(forgotPassword.fulfilled, (state, action) => {
    state.loading = false;
    state.successMessage = action.payload;
  })
  .addCase(forgotPassword.rejected, (state, action) => {
    state.loading = false;
    state.error = action.payload;
  })

  /* ---------- RESET PASSWORD ---------- */
  .addCase(resetPassword.pending, (state) => {
    state.loading = true;
    state.error = null;
    state.successMessage = null;
  })
  .addCase(resetPassword.fulfilled, (state, action) => {
    state.loading = false;
    state.successMessage = action.payload;
  })
  .addCase(resetPassword.rejected, (state, action) => {
    state.loading = false;
    state.error = action.payload;
  });


  },

  
});

/* -------------------- EXPORTS -------------------- */
export const { setCredentials, setAuthChecked } = authSlice.actions;
export default authSlice.reducer;

