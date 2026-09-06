FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS base
WORKDIR /app
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY ["contracts/FoodOrder.Contracts/FoodOrder.Contracts.csproj", "contracts/FoodOrder.Contracts/"]
COPY ["src/FoodService/FoodService.csproj", "src/FoodService/"]
RUN dotnet restore "src/FoodService/FoodService.csproj"
COPY . .
WORKDIR "/src/src/FoodService"
RUN dotnet build "FoodService.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "FoodService.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "FoodService.dll"]
