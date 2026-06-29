import { LoadingState, ErrorState } from '../components/ui'
import { ConnectionStatusSection } from '../components/ConnectionStatusSection'
import { ConnectionSection } from '../components/ConnectionSection'
import { ApiKeysSection } from '../components/ApiKeysSection'
import { AboutSection } from '../components/AboutSection'
import { useSettings } from '../hooks/useSettings'

function Settings() {
  const {
    backend,
    secrets,
    secretInputs,
    savingKeys,
    connection,
    savingConnection,
    loading,
    error,
    saveMessage,
    models,
    loadingModels,
    modelError,
    customMode,
    activeSecretKey,
    isModelConfigurable,
    handleProviderChange,
    handleMinimaxEndpointChange,
    handleModelChange,
    handleCustomModeChange,
    handleSaveConnection,
    handleSecretInputChange,
    handleSaveKey,
    handleDeleteKey,
  } = useSettings()

  if (loading) {
    return <LoadingState message="Loading settings..." />
  }

  if (error) {
    return (
      <ErrorState
        title="Failed to load settings"
        message={error}
      />
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-white mb-6">Settings</h1>

      <div className="space-y-6">
        <ConnectionStatusSection backend={backend} />

        <ConnectionSection
          connection={connection}
          models={models}
          loadingModels={loadingModels}
          modelError={modelError}
          customMode={customMode}
          saveMessage={saveMessage}
          savingConnection={savingConnection}
          isModelConfigurable={isModelConfigurable}
          onProviderChange={handleProviderChange}
          onMinimaxEndpointChange={handleMinimaxEndpointChange}
          onModelChange={handleModelChange}
          onCustomModeChange={handleCustomModeChange}
          onSaveConnection={handleSaveConnection}
        />

        <ApiKeysSection
          secrets={secrets}
          secretInputs={secretInputs}
          savingKeys={savingKeys}
          activeSecretKey={activeSecretKey}
          onInputChange={handleSecretInputChange}
          onSaveKey={handleSaveKey}
          onDeleteKey={handleDeleteKey}
        />

        <AboutSection />
      </div>
    </div>
  )
}

export default Settings
