import { useRef, useState } from 'react';

import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import Iconify from 'src/components/iconify';


// ----------------------------------------------------------------------

export default function ProductsPage() {
  const [file, setFile] = useState();
  // const [audioURL, setAudioURL] = useState();
  const fileInputRef = useRef(null);

  const handleFileChange = (event) => {
    const fileSelected = event.target.files[0];
    if (fileSelected) {
      // Handle the selected file, e.g., upload to server, process, etc.
      setFile(fileSelected)
      // setAudioURL(null)
      // console.log('Selected file:', file);
    }
  };

  const uploadCameraFootage = async () => {
    // event.preventDefault();

    try {
      const formData = new FormData();
      formData.append('audio', file);
      formData.append('date', '06-23-2024')

      const response = await fetch('http://127.0.0.1:8080/get-vocal-expressions', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      console.log(response);
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  };



  return (
    <Container>
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={5}>
        <Typography variant="h4">Hallway Cameras Streaming</Typography>

        <Button variant="contained" color="inherit" startIcon={<Iconify icon="eva:plus-fill" />} onClick={uploadCameraFootage}>
          Upload
        </Button>
      </Stack>

      <input
        type="file"
        accept=".mp3, .wav, .mp4, .mov"
        onChange={handleFileChange}
        ref={fileInputRef}
        style={{ display: 'none' }}
      />

      <Stack direction="row" alignItems="center" mb={5}>
        <Button onClick={() => fileInputRef.current.click()} variant='outlined'>Choose File</Button>
        {(file) ? <Typography variant="subtitle2" style={{marginLeft: 5}}>{file.name}</Typography> : null}
      </Stack>
      <Card>

        {/* <UserTableToolbar
          numSelected={selected.length}
          filterName={filterName}
          onFilterName={handleFilterByName}
        /> */}

        {/* <Scrollbar>
          <TableContainer sx={{ overflow: 'unset' }}>
            <Table sx={{ minWidth: 800 }}>
              <UserTableHead
                order={order}
                orderBy={orderBy}
                rowCount={users.length}
                numSelected={selected.length}
                onRequestSort={handleSort}
                onSelectAllClick={handleSelectAllClick}
                headLabel={[
                  { id: 'name', label: 'Name' },
                  { id: 'company', label: 'Company' },
                  { id: 'role', label: 'Role' },
                  { id: 'isVerified', label: 'Verified', align: 'center' },
                  { id: 'status', label: 'Status' },
                  { id: '' },
                ]}
              />
              <TableBody>
                {dataFiltered
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((row) => (
                    <UserTableRow
                      key={row.id}
                      name={row.name}
                      role={row.role}
                      status={row.status}
                      company={row.company}
                      avatarUrl={row.avatarUrl}
                      isVerified={row.isVerified}
                      selected={selected.indexOf(row.name) !== -1}
                      handleClick={(event) => handleClick(event, row.name)}
                    />
                  ))}

                <TableEmptyRows
                  height={77}
                  emptyRows={emptyRows(page, rowsPerPage, users.length)}
                />

                {notFound && <TableNoData query={filterName} />}
              </TableBody>
            </Table>
          </TableContainer>
        </Scrollbar>

        <TablePagination
          page={page}
          component="div"
          count={users.length}
          rowsPerPage={rowsPerPage}
          onPageChange={handleChangePage}
          rowsPerPageOptions={[5, 10, 25]}
          onRowsPerPageChange={handleChangeRowsPerPage}
        /> */}
      </Card>
    </Container>
  );
}
