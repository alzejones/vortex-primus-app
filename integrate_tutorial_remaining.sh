#!/bin/bash
# Script para integrar Tutorial nos 2 arquivos restantes

echo "Integrando Tutorial em VendasContent e AssessmentFormModal..."

# VendasContent.tsx - adicionar imports
sed -i '9a\import { useRef } from '"'"'react'"'"';' components/business/VendasContent.tsx
sed -i '/import { T } from/a import { TutorialHelpButton } from '"'"'../tutorial/TutorialHelpButton'"'"';\nimport { TutorialOverlay } from '"'"'../tutorial/TutorialOverlay'"'"';' components/business/VendasContent.tsx

# AssessmentFormModal.tsx - adicionar imports  
sed -i 's/import { useState, useEffect }/import { useState, useEffect, useRef }/' components/AssessmentFormModal.tsx
sed -i '/import { T }/a import { TutorialHelpButton } from '"'"'./tutorial/TutorialHelpButton'"'"';\nimport { TutorialOverlay } from '"'"'./tutorial/TutorialOverlay'"'"';' components/AssessmentFormModal.tsx

echo "✓ Imports adicionados"
echo "NOTA: Você precisa adicionar manualmente:"
echo "1. Os refs nos componentes (tipo_vendaRef, kit_produto_clienteRef, etc)"
echo "2. <TutorialOverlay targetRefs={{...}} /> e <TutorialHelpButton screenId=\"...\" /> antes do fechamento"
echo ""
echo "Consulte login.tsx, client-create.tsx ou MetasContent.tsx como referência"
