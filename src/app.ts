declare global {
  interface Window {
    KintoneRestAPIClient: typeof import('@kintone/rest-api-client').KintoneRestAPIClient
    uuidv4: typeof import('uuid').v4
  }
}

const app = () => {
  const kintoneRestAPIClient = new window.KintoneRestAPIClient()
  type fieldCodeFileKeyPair = { [property: string]: { value: { fileKey: string }[] } }
  type AttachFiledCodes = string[]

  function createFileKeyStore() {
    let uploadedfilekeys: fieldCodeFileKeyPair = {}
    return {
      initialize(fieldcodes: string[]) {
        uploadedfilekeys = fieldcodes.reduce((acc, curr) => {
          acc[curr] = { value: [] }
          return acc
        }, {} as fieldCodeFileKeyPair)
      },
      addFilekey(fieldcode: string, filekey: string) {
        if (Object.prototype.hasOwnProperty.call(uploadedfilekeys, fieldcode)) {
          uploadedfilekeys[fieldcode].value.push({ fileKey: filekey })
        } else {
          uploadedfilekeys[fieldcode] = { value: [{ fileKey: filekey }] }
        }
      },
      deleteFilekey(fieldcode: string, filekey: string) {
        if (Object.prototype.hasOwnProperty.call(uploadedfilekeys, fieldcode)) {
          uploadedfilekeys[fieldcode].value = uploadedfilekeys[fieldcode].value.filter((key) => key.fileKey !== filekey)
        }
      },
      getUploadedFileKeys() {
        return uploadedfilekeys
      },
    }
  }

  function extractFileTypes(obj: any): AttachFiledCodes {
    const result: AttachFiledCodes = []
    for (const key in obj) {
      if (obj[key] && typeof obj[key] === 'object') {
        if (obj[key].type === 'FILE') {
          result.push(key)
        }
      }
    }
    return result
  }

  async function uploadFile(fileData: Blob) {
    const fileInfo = {
      name: `${window.uuidv4()}.png`,
      data: fileData,
    }

    // Upload a file and attach it to a record
    const { fileKey } = await kintoneRestAPIClient.file.uploadFile({
      file: fileInfo,
    })
    return fileKey
  }

  async function readImageFromClipboard() {
    try {
      const clipboardItems = await navigator.clipboard.read()
      for (const clipboardItem of clipboardItems) {
        for (const type of clipboardItem.types) {
          if (/^image\/.*/.test(type)) {
            const blob = await clipboardItem.getType(type)
            return blob
          }
        }
      }
    } catch (err) {
      console.error(err)
    }
  }

  function generateImgFragment(fieldCode: string, fileKey: string, blobSize: number) {
    const attachHtmlTemplate = `
    <img
    src="/k/api/blob/download.do?fileKey=${fileKey}&amp;h=150&amp;w=150&amp;flag=SHRINK&amp;_ref=https%3A%2F%2Fcndevqpofif.cybozu.cn%2Fk%2F221%2Fedit"
    alt="" data-thumbnail-key="slide-11" class="gaia-ui-slideshow-thumbnail" />
    `.trim()
    const img = document.createElement('div')
    img.innerHTML = attachHtmlTemplate
    ;(img.firstChild! as HTMLElement).style.marginTop = '1em'
    // header
    const headerDiv = document.createElement('div')
    headerDiv.style.display = 'flex'
    headerDiv.style.alignItems = 'center'
    // headerDiv.style.justifyContent = 'space-between'
    const fileNameSpan = document.createElement('span')
    fileNameSpan.textContent = `${Math.round(blobSize / 1024)} KB`
    const deleteButton = document.createElement('button')
    deleteButton.style.marginLeft = '1em'
    deleteButton.classList.add('gaia-ui-actionmenu-save')
    deleteButton.textContent = 'delete'
    deleteButton.style.width = 'fit-content'
    deleteButton.style.minWidth = 'unset'
    headerDiv.appendChild(fileNameSpan)
    headerDiv.appendChild(deleteButton)
    // outter block
    const blockLi = document.createElement('li')
    blockLi.classList.add('file-image-container-gaia')
    blockLi.appendChild(headerDiv)
    blockLi.appendChild(img.firstChild!)
    // delete button event
    deleteButton.addEventListener('click', () => {
      fileKeyStore.deleteFilekey(fieldCode, fileKey)
      blockLi.remove()
    })
    return blockLi
  }

  function generateAttachImageButton(attachFieldCodeList: AttachFiledCodes) {
    // find all attach file container
    const containers = attachFieldCodeList.map((fieldCode) => {
      const container = kintone.app.record.getFieldElement(fieldCode)
      if (container) {
        return { dom: container, fieldCode: fieldCode }
      }
    })

    // loop containers
    for (const container of Array.from(containers)) {
      if (!container) {
        continue
      }
      const button = document.createElement('button')
      button.style.marginTop = '1em'
      button.classList.add('gaia-ui-actionmenu-save')
      button.style.width = 'fit-content'
      button.style.minWidth = 'unset'
      button.innerText = 'paste clipboard'
      button.addEventListener('click', async () => {
        const blob = await readImageFromClipboard()
        if (blob && container) {
          const filekey = await uploadFile(blob)
          fileKeyStore.addFilekey(container.fieldCode, filekey)
          const ul = container.dom.querySelector('ul')
          if (ul) {
            // const li = document.createElement('li')
            ul.appendChild(generateImgFragment(container.fieldCode, filekey, blob.size))
          }
        }
      })
      // add button to container
      container.dom.appendChild(button)
    }
  }

  async function updateRecord() {
    const files = fileKeyStore.getUploadedFileKeys()
    const result = await kintoneRestAPIClient.record.updateRecord({
      app: kintone.app.getId()!,
      id: kintone.app.record.getId()!,
      record: files,
    })
    location.reload()
  }

  function getAlredayExsitFileKeys(record: any) {
    for (const key in record) {
      if (record[key] && typeof record[key] === 'object') {
        if (record[key].type === 'FILE') {
          // loop record[key].value
          for (const item of record[key].value) {
            fileKeyStore.addFilekey(key, item.fileKey)
          }
        }
      }
    }
  }
  const fileKeyStore = createFileKeyStore()
  kintone.events.on(['app.record.detail.show'], (event) => {
    // step 1: 得到所有附件的字段代码
    const allAttachmentFieldCodes = extractFileTypes(event.record)
    if (allAttachmentFieldCodes.length === 0) {
      return event
    }
    // step 2: 根据字段代码，生成【读剪切板中图片的按钮】，放在每个附件的元素里
    generateAttachImageButton(allAttachmentFieldCodes)
    // step 3: 初始化fileKeyStore
    fileKeyStore.initialize(allAttachmentFieldCodes)
    getAlredayExsitFileKeys(event.record)
    // step 4: 在空白处生成一个【提交】按钮，点击后，更新record
    const headerMenuSpace = kintone.app.record.getHeaderMenuSpaceElement()
    const updateButton = document.createElement('button')
    updateButton.classList.add('gaia-ui-actionmenu-save')
    updateButton.style.width = 'fit-content'
    updateButton.style.minWidth = 'unset'
    updateButton.innerText = 'save all'
    updateButton.addEventListener('click', () => {
      updateRecord()
    })
    headerMenuSpace?.appendChild(updateButton)
    return event
  })
}

export default app
