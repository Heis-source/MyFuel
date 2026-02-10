package com.myfuel.mobile.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.myfuel.mobile.data.FuelRepository
import com.myfuel.mobile.models.Charger
import com.myfuel.mobile.models.FuelStation
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

sealed class UiState {
    object Loading : UiState()
    data class Success(val fuelStations: List<FuelStation>, val chargers: List<Charger>) : UiState()
    data class Error(val message: String) : UiState()
    object Idle : UiState()
}

class MainViewModel : ViewModel() {
    private val repository = FuelRepository()
    
    private val _uiState = MutableStateFlow<UiState>(UiState.Idle)
    val uiState: StateFlow<UiState> = _uiState.asStateFlow()

    fun fetchNearbyStations(lat: Double, lon: Double) {
        viewModelScope.launch {
            _uiState.value = UiState.Loading
            
            val result = repository.getNearbyStations(lat, lon)
            
            result.onSuccess { response ->
                if (response.success) {
                    _uiState.value = UiState.Success(response.results.fuelStations, response.results.chargers)
                } else {
                    _uiState.value = UiState.Error("Error al obtener datos")
                }
            }.onFailure { exception ->
                _uiState.value = UiState.Error(exception.message ?: "Error desconocido")
            }
        }
    }
}
