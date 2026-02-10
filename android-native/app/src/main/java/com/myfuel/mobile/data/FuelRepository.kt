package com.myfuel.mobile.data

import com.myfuel.mobile.models.ApiResponse
import com.myfuel.mobile.network.RetrofitClient
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class FuelRepository {
    private val apiService = RetrofitClient.apiService

    suspend fun getNearbyStations(lat: Double, lon: Double): Result<ApiResponse> {
        return withContext(Dispatchers.IO) {
            try {
                val response = apiService.getNearbyStations(lat, lon)
                Result.success(response)
            } catch (e: Exception) {
                Result.failure(e)
            }
        }
    }
}
