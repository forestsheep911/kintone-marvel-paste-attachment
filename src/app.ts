// import { KintoneRestAPIClient } from '@kintone/rest-api-client'
declare global {
  interface Window {
    KintoneRestAPIClient: any
  }
}

const app = () => {
  console.log('monkey jumping on the bed.')
  // const kintoneRestAPIClient = new KintoneRestAPIClient()

  const kintoneRestAPIClient = new window.KintoneRestAPIClient()

  let fileKeyVar = ''
  type fieldCodeFileKeyPair = { [property: string]: { value: { fileKey: string }[] } }

  function createFileKeyStore() {
    let uploadedfilekeys: fieldCodeFileKeyPair = {
      fieldcode1: { value: [{ fileKey: 'b' }, { fileKey: 'c' }] },
      fieldcode2: { value: [{ fileKey: 'k' }, { fileKey: 's' }] },
    }

    return {
      initialize(fieldcodes: string[]) {
        uploadedfilekeys = fieldcodes.reduce((acc, curr) => {
          acc[curr] = { value: [] }
          return acc
        }, {} as fieldCodeFileKeyPair)
      },
      addFilekey(fieldcode: string, filekey: string) {
        if (uploadedfilekeys.hasOwnProperty(fieldcode)) {
          uploadedfilekeys[fieldcode].value.push({ fileKey: filekey })
        } else {
          uploadedfilekeys[fieldcode] = { value: [{ fileKey: filekey }] }
        }
      },
      deleteFilekey(fieldcode: string, filekey: string) {
        if (uploadedfilekeys.hasOwnProperty(fieldcode)) {
          uploadedfilekeys[fieldcode].value = uploadedfilekeys[fieldcode].value.filter((key) => key.fileKey !== filekey)
        }
      },
      getUploadedFileKeys() {
        return uploadedfilekeys
      },
    }
  }

  // let fileKeyStore = createFileKeyStore()
  // fileKeyStore.initialize(['fieldcode1', 'fieldcode2'])
  // console.log(fileKeyStore.getUploadedFileKeys())

  // let fileKeyStore = createFileKeyStore()
  // fileKeyStore.addFilekey('fieldcode1', 'f1')
  // fileKeyStore.addFilekey('fieldcode1', 'f2')
  // fileKeyStore.addFilekey('fieldcode2', 'f3')
  // console.log(fileKeyStore.getUploadedFileKeys())
  // fileKeyStore.deleteFilekey('fieldcode1', 'f2')
  // console.log(fileKeyStore.getUploadedFileKeys())

  type AttachFiledCode = string[]

  function extractFileTypes(obj: any): AttachFiledCode {
    let result: AttachFiledCode = []
    for (let key in obj) {
      if (obj[key] && typeof obj[key] === 'object') {
        if (obj[key].type === 'FILE') {
          result.push(key)
        }
      }
    }
    return result
  }

  async function uploadFile(fileData: Blob) {
    // const APP_ID = '221'
    // const ATTACHMENT_FIELD_CODE = 'atta'
    const fileInfo = {
      name: 'Hello.png',
      data: fileData,
    }

    // Upload a file and attach it to a record
    const { fileKey } = await kintoneRestAPIClient.file.uploadFile({
      file: fileInfo,
    })
    console.log(fileKey)
    return fileKey
    // const result = await client.record.addRecord({
    //   app: APP_ID,
    //   record: {
    //     [ATTACHMENT_FIELD_CODE]: {
    //       value: [{ fileKey }],
    //     },
    //   },
    // })
    // console.log(result)
    // const id = result.id

    // const { record } = await client.record.getRecord({
    //   app: APP_ID,
    //   id,
    // })

    // type FileInformation = {
    //   contentType: string
    //   fileKey: string
    //   name: string
    //   size: string
    // }

    // const data = await client.file.downloadFile({
    //   fileKey: (record[ATTACHMENT_FIELD_CODE].value as FileInformation[])[0].fileKey,
    // })

    // console.log(data)
  }

  async function downFile(fileKey: string) {
    // Download a file
    const data = await kintoneRestAPIClient.file.downloadFile({
      fileKey: fileKey,
    })
    console.log(data)
  }

  async function readImageFromClipboard() {
    try {
      const clipboardItems = await navigator.clipboard.read()
      for (let clipboardItem of clipboardItems) {
        for (let type of clipboardItem.types) {
          if (/^image\/.*/.test(type)) {
            const blob = await clipboardItem.getType(type)
            return blob
          }
        }
      }
    } catch (err) {
      console.error('Failed to read clipboard contents: ', err)
    }
  }

  function generateImgFragment(fieldCode: string, fileKey: string) {
    const attachHtmlTemplate = `
    <img
    src="/k/api/blob/download.do?fileKey=${fileKey}&amp;h=150&amp;w=150&amp;flag=SHRINK&amp;_ref=https%3A%2F%2Fcndevqpofif.cybozu.cn%2Fk%2F221%2Fedit"
    alt="" title="your picture" data-thumbnail-key="slide-11" class="gaia-ui-slideshow-thumbnail" />
    `.trim()
    const img = document.createElement('div')
    img.innerHTML = attachHtmlTemplate
    // header
    const headerDiv = document.createElement('div')
    headerDiv.style.display = 'flex'
    headerDiv.style.justifyContent = 'space-between'
    const fileNameSpan = document.createElement('span')
    fileNameSpan.textContent = 'your picture'
    const deleteButton = document.createElement('button')
    deleteButton.textContent = '削除'
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
      console.log('now filekeys is:', fileKeyStore.getUploadedFileKeys())
      blockLi.remove()
    })
    return blockLi
  }

  function generateAttachImageButton(attachFieldCodeList: AttachFiledCode) {
    // find all attach file container
    const containers = attachFieldCodeList.map((fieldCode) => {
      const container = kintone.app.record.getFieldElement(fieldCode)
      if (container) {
        return { dom: container, fieldCode: fieldCode }
      }
    })
    console.log(containers)

    // loop containers
    for (let container of Array.from(containers)) {
      if (!container) {
        continue
      }
      console.log(container)
      let button = document.createElement('button')
      button.innerText = 'クリックボードから画像を貼り付け'
      button.addEventListener('click', async () => {
        const blob = await readImageFromClipboard()
        if (blob && container) {
          const filekey = await uploadFile(blob)
          fileKeyStore.addFilekey(container.fieldCode, filekey)
          console.log('now filekeys is:', fileKeyStore.getUploadedFileKeys())
          const ul = container.dom.querySelector('ul')
          if (ul) {
            // const li = document.createElement('li')
            ul.appendChild(generateImgFragment(container.fieldCode, filekey))
          }
        }
      })
      // add button to container
      container.dom.appendChild(button)
    }
  }

  let fileKeyStore = createFileKeyStore()

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
    for (let key in record) {
      if (record[key] && typeof record[key] === 'object') {
        if (record[key].type === 'FILE') {
          // loop record[key].value
          for (let item of record[key].value) {
            fileKeyStore.addFilekey(key, item.fileKey)
          }
        }
      }
    }
    console.log('exist file keys are:')
    console.log(fileKeyStore.getUploadedFileKeys())
  }

  kintone.events.on(['app.record.detail.show'], (event) => {
    console.log(event.record)

    // step 1: 得到所有附件的字段代码
    let allAttachmentFieldCode = extractFileTypes(event.record)
    // console.log(allAttachmentFieldCode)
    // step 2: 根据字段代码，生成【读剪切板中图片的按钮】，放在每个附件的元素里
    generateAttachImageButton(allAttachmentFieldCode)
    // step 3: 初始化fileKeyStore
    fileKeyStore.initialize(allAttachmentFieldCode)
    getAlredayExsitFileKeys(event.record)
    // step 4: 在空白处生成一个【提交】按钮，点击后，更新record
    const headerMenuSpace = kintone.app.record.getHeaderMenuSpaceElement()
    let updateButton = document.createElement('button')
    updateButton.innerText = '画像一括保存'
    updateButton.addEventListener('click', () => {
      updateRecord()
    })
    headerMenuSpace?.appendChild(updateButton)
    return event
  })
}

export default app
