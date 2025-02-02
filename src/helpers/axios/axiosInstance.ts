import { authKey } from "@/constants/AuthKey.constant";
import axios from "axios";
import Cookies from "js-cookie";

const instance = axios.create();
instance.defaults.headers.post["Content-Type"] = "application/json";
instance.defaults.headers["Accept"] = "application/json";
instance.defaults.timeout = 60000;

instance.interceptors.request.use(
  function (config) {
    const accessToken = Cookies.get(authKey);
    if (accessToken && typeof accessToken === "string") {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    return config;
  },
  function (error) {
    console.error(error);
    return Promise.reject(error);
  },
);

instance.interceptors.response.use(
  function (response) {
    return response;
  },

  async function (error) {
    const responseObj: {
      success: boolean;
      status: number;
      message: string;
    } = {
      success: false,
      status: error?.response?.data?.statusCode || 500,
      message: error?.response?.data?.message || "Something went wrong!!!",
    };

    return responseObj;
  },
);

export { instance };
