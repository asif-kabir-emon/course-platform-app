export const ApiError = (status: number, message: string) => {
  return Response.json(
    {
      status: status,
      message,
      success: false,
    },
    { status: status },
  );
};
