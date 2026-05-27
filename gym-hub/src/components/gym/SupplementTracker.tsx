import { useState } from 'react'
import { Icon } from './Icon'
import type { SupplementItem } from '../../types/gym'

const EMOJI_OPTIONS = ['💊', '🍊', '🧴', '🫀', '🦴', '🥛', '☕', '🌿', '💉', '⚡', '🫙', '🔋']

interface SupplementTrackerProps {
  items: SupplementItem[]
  onToggle: (id: string) => void
  onAdd: (name: string, icon: string) => Promise<void>
  onRemove: (id: string) => void
}

export function SupplementTracker({ items, onToggle, onAdd, onRemove }: SupplementTrackerProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newName, setNewName] = useState('')
  const [newIcon, setNewIcon] = useState('💊')
  const [isSaving, setIsSaving] = useState(false)

  const handleAdd = async () => {
    if (!newName.trim()) return
    setIsSaving(true)
    try {
      await onAdd(newName.trim(), newIcon)
      setNewName('')
      setNewIcon('💊')
      setShowAddForm(false)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="bg-white/10 p-4 rounded-2xl border border-white/20 backdrop-blur-md">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-[10px] font-black uppercase tracking-widest text-white/90 flex items-center gap-1">
          <Icon name="target" size={14} /> Suplementação Diária
        </h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => { setShowAddForm(prev => !prev); setIsEditing(false) }}
            aria-label="Adicionar suplemento"
            className="text-white/60 hover:text-white transition-colors text-xs font-black focus:outline-none"
          >
            +
          </button>
          <button
            type="button"
            onClick={() => { setIsEditing(prev => !prev); setShowAddForm(false) }}
            aria-label={isEditing ? 'Concluir edição' : 'Editar suplementos'}
            className={`text-[10px] font-black uppercase tracking-widest transition-colors focus:outline-none ${
              isEditing ? 'text-orange-300' : 'text-white/50 hover:text-white/80'
            }`}
          >
            {isEditing ? 'Concluir' : 'Editar'}
          </button>
        </div>
      </div>

      {/* Supplement buttons */}
      <div className="flex flex-wrap gap-2">
        {items.map(item => (
          <div key={item.id} className="relative">
            <button
              onClick={() => onToggle(item.id)}
              className={`py-2.5 px-3 rounded-xl text-sm font-bold transition-all border flex items-center gap-1.5 ${
                item.takenToday
                  ? 'bg-emerald-500 border-emerald-400 text-white shadow-inner scale-[0.98]'
                  : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
              }`}
            >
              <span>{item.icon}</span>
              <span className="text-xs">{item.name}</span>
            </button>
            {isEditing && !item.isLegacy && (
              <button
                onClick={() => onRemove(item.id)}
                aria-label={`Remover ${item.name}`}
                className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 rounded-full text-white text-[9px] flex items-center justify-center leading-none focus:outline-none hover:bg-red-600 transition-colors font-black"
              >
                ✕
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Add form */}
      {showAddForm && (
        <div className="mt-3 pt-3 border-t border-white/15 space-y-2">
          <input
            type="text"
            placeholder="Nome do suplemento..."
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-white/40 transition-colors"
            autoFocus
          />
          <div>
            <p className="text-[9px] text-white/50 uppercase tracking-widest mb-1.5">Ícone</p>
            <div className="flex flex-wrap gap-1.5">
              {EMOJI_OPTIONS.map(emoji => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setNewIcon(emoji)}
                  className={`w-8 h-8 rounded-lg text-base transition-all focus:outline-none ${
                    newIcon === emoji
                      ? 'bg-white/30 scale-110'
                      : 'bg-white/10 hover:bg-white/20'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={() => { setShowAddForm(false); setNewName(''); setNewIcon('💊') }}
              className="flex-1 py-2 rounded-xl text-xs font-bold text-white/60 hover:text-white/80 transition-colors focus:outline-none"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleAdd}
              disabled={!newName.trim() || isSaving}
              className="flex-1 py-2 rounded-xl text-xs font-black bg-white/20 hover:bg-white/30 text-white transition-colors focus:outline-none disabled:opacity-40"
            >
              {isSaving ? '...' : `${newIcon} Salvar`}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
